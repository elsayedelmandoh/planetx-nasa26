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
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import requests
from astropy.io.votable import parse_single_table
from astropy.time import Time

from src.core.settings import settings
from src.utils.data_processing import group_into_passes, propagate, render_passes

SIA_URL = "https://irsa.ipac.caltech.edu/SIA"
GAIA_TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"
GAIA_EPOCH = 2016.0  # gaia dr3 positions are epoch 2016.0
GAIA_G_MAX = 19.0
TIMEOUT_S = (10, 120)  # fail connects fast, allow slow reads: busy irsa refuses connections
TRIES = 3


def gaia_stars(ra: float, dec: float, radius_deg: float) -> list[dict]:
    """gaia dr3 sources brighter than g < 19 in a cone, epoch 2016.0. [] when unreachable."""
    import csv

    query = (
        "SELECT ra, dec, pmra, pmdec, phot_g_mean_mag FROM gaiadr3.gaia_source "
        f"WHERE 1=CONTAINS(POINT({ra},{dec}), CIRCLE({ra},{dec},{radius_deg})) "
        f"AND phot_g_mean_mag < {GAIA_G_MAX}"
    )
    params = {"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": query}
    for attempt in range(1, TRIES + 1):
        try:
            resp = requests.get(GAIA_TAP_URL, params=params, timeout=TIMEOUT_S)
            if resp.ok:
                break
        except requests.RequestException as err:
            print(f"gaia tap attempt {attempt} failed: {err}")
        if attempt < TRIES:
            time.sleep(5 * attempt)
    else:
        print("warning: gaia archive unreachable, continuing with no gaia cross-match")
        return []
    stars = []
    for row in csv.DictReader(io.StringIO(resp.text)):
        try:
            pmra = float(row["pmra"]) if row["pmra"].strip() else float("nan")
            pmdec = float(row["pmdec"]) if row["pmdec"].strip() else float("nan")
            stars.append({
                "ra": float(row["ra"]), "dec": float(row["dec"]),
                "pmra": pmra if pmra == pmra else 0.0,  # nan pm -> 0
                "pmdec": pmdec if pmdec == pmdec else 0.0,
                "g": float(row["phot_g_mean_mag"]),
            })
        except (TypeError, ValueError, KeyError):
            continue
    return stars


def gaia_radius_deg(fov_arcmin: float) -> float:
    """cross-match cone radius: 0.75 of the cutout request radius."""
    return 0.75 * fov_arcmin * 1.5 / 60


def load_gaia_stars(
    slug: str, ra: float, dec: float, fov_arcmin: float, offline: bool = False
) -> list[dict]:
    """gaia stars for a target, cached at data/raw/<slug>/gaia.json."""
    cache = settings.DATA_DIR / "raw" / slug / "gaia.json"
    if cache.exists():
        try:
            return json.loads(cache.read_text())
        except json.JSONDecodeError:
            print(f"warning: unreadable gaia cache {cache}, refetching")
    if offline:
        print("warning: --offline and no readable gaia cache, continuing with no cross-match")
        return []
    stars = gaia_stars(ra, dec, gaia_radius_deg(fov_arcmin))
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(stars, indent=2) + "\n")
    return stars


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
        visits += [{**v, "release": coll} for v in parse_sia(resp.content, detector)]
    return visits


def sia_cache_path(slug: str, detector: str) -> Path:
    return settings.DATA_DIR / "raw" / slug / detector / "visits.json"


def read_sia_cache(path: Path, key: str) -> list[dict] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text()).get(key)
    except (json.JSONDecodeError, AttributeError):
        return None


def get_sia_visits(
    ra: float,
    dec: float,
    detector: str,
    releases: list[str],
    slug: str,
    offline: bool,
    fallback: list[dict] | None = None,
) -> list[dict]:
    """sia visits with on-disk fallback: cached per (target, detector, center) in visits.json."""
    key = center_slug(ra, dec)
    path = sia_cache_path(slug, detector)
    cached = read_sia_cache(path, key)
    if offline:
        if cached is None:
            if fallback is not None:
                print(f"--offline: no cached visit list for center {key}, using j2000 visit list")
                return fallback
            raise SystemExit(f"--offline: no cached visit list at {path} for center {key}")
        print(f"irsa unreachable: using cached visit list ({len(cached)} visits)")
        return cached
    try:
        visits = query_sia_visits(ra, dec, detector, releases)
    except requests.RequestException as err:
        if cached is not None:
            print(f"irsa unreachable: using cached visit list ({len(cached)} visits)")
            return cached
        if fallback is not None:
            print(f"irsa unreachable and no cached visit list for center {key}, using j2000 list")
            return fallback
        raise SystemExit(f"irsa unreachable and no cached visit list at {path}: {err}") from None
    cache = {}
    if path.exists():
        try:
            cache = json.loads(path.read_text())
        except json.JSONDecodeError:
            cache = {}
    cache[key] = [{"mjd": v["mjd"], "url": v["url"], "release": v.get("release")} for v in visits]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, indent=2) + "\n")
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


def cap_passes(passes: list[list[dict]], max_visits: int) -> list[list[dict]]:
    """keep at most max_visits evenly spread visits per pass (time-sorted input)."""
    capped = []
    for n, p in enumerate(passes, start=1):
        if len(p) > max_visits:
            idx = [int(round(i)) for i in np.linspace(0, len(p) - 1, max_visits)]
            kept = [p[i] for i in idx]
            print(f"capped pass {n}: {len(kept)}/{len(p)} visits")
            capped.append(kept)
        else:
            capped.append(p)
    return capped


def download_visits(
    visits: list[dict], ra: float, dec: float, size_deg: float, offline: bool = False
) -> None:
    """fetch cutouts in parallel; a failed visit is skipped, not fatal."""
    if offline:
        print("--offline: skipping cutout downloads, using on-disk files only")
        return

    def fetch(v):
        try:
            download_cutout(v["url"], ra, dec, size_deg, v["path"])
        except (RuntimeError, requests.RequestException) as err:
            # irsa is often busy; one lost visit must not kill the run, a rerun fetches it later
            print(f"skipped visit: {err}")

    with ThreadPoolExecutor(max_workers=settings.DOWNLOAD_WORKERS) as ex:
        list(ex.map(fetch, visits))


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
            # markers files are diff-a-b.markers.json; they hang off their diff entry, not their own
            diffs = (p for p in det_dir.glob("diff-*.json") if not p.name.endswith(".markers.json"))
            for js in sorted(diffs, key=lambda p: tuple(int(x) for x in p.stem.split("-")[1:])):
                png = js.with_suffix(".png")
                if not png.exists():
                    continue
                rel = f"cache/{slug}/{det}"
                entry = {"png": f"{rel}/{png.name}", "json": f"{rel}/{js.name}"}
                markers = det_dir / f"{js.stem}.markers.json"
                if markers.exists():
                    entry["markers"] = f"{rel}/{markers.name}"
                differences.append(entry)
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


def run(
    target: str, detector: str, fov_arcmin: float | None = None, offline: bool = False
) -> list[dict]:
    """whole step for one target and detector. rerun-safe: cutouts already on disk are reused."""
    by_name = {t["name"].lower(): t for t in settings.TARGETS}
    if target.lower() not in by_name:
        raise SystemExit(f"unknown target {target!r}, choose from {sorted(by_name)}")
    t = by_name[target.lower()]
    fov = fov_arcmin or settings.DEFAULT_FOV_ARCMIN
    slug = slugify(t["name"])

    # the j2000 cone only estimates the mean visit epoch (SPHEREx scans whole sky);
    # the real visit list, cutouts and common wcs center use the propagated position.
    rough = get_sia_visits(
        t["ra_deg"], t["dec_deg"], detector, settings.DATA_RELEASES, slug, offline
    )
    if not rough:
        raise SystemExit(f"no {detector} visits for {t['name']} in {settings.DATA_RELEASES}")
    mean_mjd = sum(v["mjd"] for v in rough) / len(rough)
    year = Time(mean_mjd, format="mjd").jyear
    ra_c, dec_c = propagate(t, year)
    visits = get_sia_visits(
        ra_c, dec_c, detector, settings.DATA_RELEASES, slug, offline, fallback=rough
    ) or rough
    mean_mjd = sum(v["mjd"] for v in visits) / len(visits)
    size_deg = cutout_size_deg(fov)
    ctr = center_slug(ra_c, dec_c, size_deg)
    raw_dir = settings.DATA_DIR / "raw" / slug / detector
    raw_dir.mkdir(parents=True, exist_ok=True)
    # cap visits per pass before downloading; dropped visits' on-disk cutouts are just unused
    capped = cap_passes(group_into_passes(visits), settings.MAX_VISITS_PER_PASS)
    visits = [v for p in capped for v in p]
    for v in visits:
        v["path"] = raw_dir / (f"{ctr}_" + v["url"].rsplit("/", 1)[-1])
    download_visits(visits, ra_c, dec_c, size_deg, offline)
    got = [v for v in visits if v["path"].exists()]
    if not got:
        raise SystemExit(f"no {detector} cutouts for {t['name']}, irsa busy: rerun later")
    print(f"{len(got)}/{len(visits)} visits on disk")
    print(f"frames centered on the propagated position at mean mjd {mean_mjd:.1f}")
    gaia = load_gaia_stars(slug, ra_c, dec_c, fov, offline)
    out_dir = settings.WEB_DIR / "cache" / slug / detector
    return render_passes(
        got, ra_c, dec_c, fov, out_dir, frame_epoch_mjd=mean_mjd, target=t, gaia_stars=gaia
    )


DETECTORS = [f"d{i}" for i in range(1, 7)]


def run_all(offline: bool = False) -> int:
    """loop all targets x detectors, keep going on failure, print a summary."""
    results = []
    for t in settings.TARGETS:
        for det in DETECTORS:
            try:
                run(t["name"], det, offline=offline)
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
    ap.add_argument(
        "--offline", action="store_true", help="use cached visit lists, never hit the network"
    )
    args = ap.parse_args()
    if args.all:
        fails = run_all(offline=args.offline)
        write_index()
        sys.exit(1 if fails else 0)
    if not args.target or not args.detector:
        ap.error("--target and --detector are required unless --all is given")
    for n, m in enumerate(run(args.target, args.detector, offline=args.offline), start=1):
        r = m["date_range"]
        print(f"pass-{n}: {m['visit_count']} visits, {r['start']} to {r['end']}")
    write_index()
