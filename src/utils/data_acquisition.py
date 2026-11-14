"""propose: fetch spherex visits and level 2 cutouts from irsa, then run the pass pipeline.
input: target name (configs TARGETS), detector, data releases.
output: data/raw/ fits cutouts, web/cache/<target-slug>/<detector>/pass-<n>.png + .json.
run: python -m src.utils.data_acquisition --target "WISE 0855" --detector d6"""

import argparse
import io
import json
import re
import sys
import time
from pathlib import Path

import requests
from astropy.io.votable import parse_single_table
from astropy.time import Time

from src.core.settings import settings
from src.utils.data_processing import propagate, render_passes

SIA_URL = "https://irsa.ipac.caltech.edu/SIA"
TIMEOUT_S = (10, 120)  # fail connects fast, allow slow reads: busy irsa refuses connections
TRIES = 3


def parse_sia(content: bytes, detector: str) -> list[dict]:
    """votable bytes -> [{"mjd", "url"}] for one detector (d6 -> SPHEREx-D6)."""
    table = parse_single_table(io.BytesIO(content)).to_table(use_names_over_ids=True)
    band = f"SPHEREx-{detector.upper()}"
    return [
        {"mjd": float(r["t_min"]), "url": str(r["access_url"])}
        for r in table
        if r["energy_bandpassname"] == band
    ]


def query_sia_visits(ra: float, dec: float, detector: str, releases: list[str]) -> list[dict]:
    """one sia v2 cone search per release, merged. raises on http errors."""
    visits = []
    for coll in releases:
        params = {"COLLECTION": coll, "POS": f"CIRCLE {ra} {dec} 0.01", "MAXREC": 2000}
        resp = requests.get(SIA_URL, params=params, timeout=TIMEOUT_S)
        resp.raise_for_status()
        visits += parse_sia(resp.content, detector)
    return visits


def download_cutout(url: str, ra: float, dec: float, size_deg: float, dest) -> None:
    """get a cutout fits. the service sometimes answers 200 with a text 'server busy' body."""
    if dest.exists():
        return
    params = {"center": f"{ra},{dec}", "size": size_deg}
    for attempt in range(1, TRIES + 1):
        resp = requests.get(url, params=params, timeout=TIMEOUT_S)
        if resp.ok and resp.content[:6] == b"SIMPLE":
            dest.write_bytes(resp.content)
            return
        if attempt < TRIES:
            time.sleep(5 * attempt)
    raise RuntimeError(
        f"cutout failed after {TRIES} tries: {url} -> {resp.status_code} {resp.content[:60]!r}"
    )


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def build_index(web_dir: Path) -> dict:
    """scan pass-*.json and diff-*.json under web_dir/cache -> index.json contract."""
    cache = web_dir / "cache"
    targets = []
    for t in settings.TARGETS:  # config order
        slug = slugify(t["name"])
        detectors = {}
        differences_map = {}
        for d in range(1, 7):
            det = f"d{d}"
            det_dir = cache / slug / det
            if not det_dir.is_dir():
                continue
            passes = []
            for js in sorted(det_dir.glob("pass-*.json"), key=lambda p: int(p.stem.split("-")[1])):
                png = js.with_suffix(".png")
                if not png.exists():
                    continue
                rel = f"cache/{slug}/{det}"
                passes.append({"png": f"{rel}/{png.name}", "json": f"{rel}/{js.name}"})
            differences = []
            diffs = det_dir.glob("diff-*.json")
            for js in sorted(diffs, key=lambda p: tuple(int(x) for x in p.stem.split("-")[1:])):
                png = js.with_suffix(".png")
                if not png.exists():
                    continue
                rel = f"cache/{slug}/{det}"
                differences.append({"png": f"{rel}/{png.name}", "json": f"{rel}/{js.name}"})
            if passes:
                detectors[det] = passes
            if differences:
                differences_map[det] = differences
        if detectors:
            targets.append(
                {
                    "name": t["name"],
                    "slug": slug,
                    "ra_deg": t["ra_deg"],
                    "dec_deg": t["dec_deg"],
                    "kind": t["kind"],
                    "detectors": detectors,
                    "differences": differences_map,
                }
            )
    return {"targets": targets}


def write_index(web_dir: Path | None = None) -> Path:
    web_dir = web_dir or settings.WEB_DIR
    dest = web_dir / "cache" / "index.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(build_index(web_dir), indent=2) + "\n")
    print(f"wrote {dest}")
    return dest


def center_slug(ra: float, dec: float, size_deg: float | None = None) -> str:
    """center tag for cache file names: keeps stale cutouts from being reused."""
    tag = f"{ra:.4f}_{dec:.4f}".replace("-", "m")
    return f"{tag}_{size_deg:.4f}" if size_deg is not None else tag


def cutout_size_deg(fov_arcmin: float) -> float:
    """request 1.5x fov so reprojected north-up frames keep data to the edges."""
    return 1.5 * fov_arcmin / 60


def run(target: str, detector: str, fov_arcmin: float | None = None) -> list[dict]:
    """whole step for one target and detector. rerun-safe: cutouts already on disk are reused."""
    by_name = {t["name"].lower(): t for t in settings.TARGETS}
    if target.lower() not in by_name:
        raise SystemExit(f"unknown target {target!r}, choose from {sorted(by_name)}")
    t = by_name[target.lower()]
    fov = fov_arcmin or settings.DEFAULT_FOV_ARCMIN
    slug = slugify(t["name"])

    # the j2000 cone only estimates the mean visit epoch (SPHEREx scans whole sky);
    # the real visit list, cutouts and common wcs center use the propagated position.
    rough = query_sia_visits(t["ra_deg"], t["dec_deg"], detector, settings.DATA_RELEASES)
    if not rough:
        raise SystemExit(f"no {detector} visits for {t['name']} in {settings.DATA_RELEASES}")
    mean_mjd = sum(v["mjd"] for v in rough) / len(rough)
    year = Time(mean_mjd, format="mjd").jyear
    ra_c, dec_c = propagate(t, year)
    visits = query_sia_visits(ra_c, dec_c, detector, settings.DATA_RELEASES) or rough
    mean_mjd = sum(v["mjd"] for v in visits) / len(visits)
    size_deg = cutout_size_deg(fov)
    ctr = center_slug(ra_c, dec_c, size_deg)
    raw_dir = settings.DATA_DIR / "raw" / slug / detector
    raw_dir.mkdir(parents=True, exist_ok=True)
    for v in visits:
        v["path"] = raw_dir / (f"{ctr}_" + v["url"].rsplit("/", 1)[-1])
        try:
            download_cutout(v["url"], ra_c, dec_c, size_deg, v["path"])
        except (RuntimeError, requests.RequestException) as err:
            # irsa is often busy; one lost visit must not kill the run, a rerun fetches it later
            print(f"skipped visit: {err}")
    got = [v for v in visits if v["path"].exists()]
    if not got:
        raise SystemExit(f"no {detector} cutouts for {t['name']}, irsa busy: rerun later")
    print(f"{len(got)}/{len(visits)} visits on disk")
    print(f"frames centered on the propagated position at mean mjd {mean_mjd:.1f}")
    out_dir = settings.WEB_DIR / "cache" / slug / detector
    return render_passes(got, ra_c, dec_c, fov, out_dir, frame_epoch_mjd=mean_mjd, target=t)


DETECTORS = [f"d{i}" for i in range(1, 7)]


def run_all() -> int:
    """loop all targets x detectors, keep going on failure, print a summary."""
    results = []
    for t in settings.TARGETS:
        for det in DETECTORS:
            try:
                run(t["name"], det)
                results.append((t["name"], det, "ok"))
            except (SystemExit, Exception) as err:
                print(f"error: {t['name']} {det}: {err}")
                results.append((t["name"], det, "fail"))
    fails = sum(1 for _, _, s in results if s == "fail")
    print("\nsummary:")
    for name, det, status in results:
        print(f"{name:16} {det}  {status}")
    print(f"{len(results) - fails}/{len(results)} ok, {fails} failed")
    return fails


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--target")
    ap.add_argument("--detector")
    ap.add_argument("--all", action="store_true", help="run all targets x d1..d6")
    args = ap.parse_args()
    if args.all:
        fails = run_all()
        write_index()
        sys.exit(1 if fails else 0)
    if not args.target or not args.detector:
        ap.error("--target and --detector are required unless --all is given")
    for n, m in enumerate(run(args.target, args.detector), start=1):
        r = m["date_range"]
        print(f"pass-{n}: {m['visit_count']} visits, {r['start']} to {r['end']}")
    write_index()
