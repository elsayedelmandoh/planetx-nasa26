"""propose: fetch spherex visits and level 2 cutouts from irsa, then run the pass pipeline.
input: target name (configs TARGETS), detector, data releases.
output: data/raw/ fits cutouts, web/cache/<target-slug>/<detector>/pass-<n>.png + .json.
run: python -m src.utils.data_acquisition --target "WISE 0855" --detector d6"""

import argparse
import io
import re
import time

import requests
from astropy.io.votable import parse_single_table

from src.core.settings import settings
from src.utils.data_processing import render_passes

SIA_URL = "https://irsa.ipac.caltech.edu/SIA"
TIMEOUT_S = 120
TRIES = 5


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


def download_cutout(url: str, ra: float, dec: float, fov_arcmin: float, dest) -> None:
    """get a cutout fits. the service sometimes answers 200 with a text 'server busy' body."""
    if dest.exists():
        return
    params = {"center": f"{ra},{dec}", "size": fov_arcmin / 60}
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


def run(target: str, detector: str, fov_arcmin: float | None = None) -> list[dict]:
    """whole step for one target and detector. rerun-safe: cutouts already on disk are reused."""
    by_name = {t["name"].lower(): t for t in settings.TARGETS}
    if target.lower() not in by_name:
        raise SystemExit(f"unknown target {target!r}, choose from {sorted(by_name)}")
    t = by_name[target.lower()]
    ra, dec = t["ra_deg"], t["dec_deg"]
    fov = fov_arcmin or settings.DEFAULT_FOV_ARCMIN
    slug = re.sub(r"[^a-z0-9]+", "-", t["name"].lower()).strip("-")

    visits = query_sia_visits(ra, dec, detector, settings.DATA_RELEASES)
    if not visits:
        raise SystemExit(f"no {detector} visits for {t['name']} in {settings.DATA_RELEASES}")
    raw_dir = settings.DATA_DIR / "raw" / slug / detector
    raw_dir.mkdir(parents=True, exist_ok=True)
    for v in visits:
        v["path"] = raw_dir / (v["url"].rsplit("/", 1)[-1])
        try:
            download_cutout(v["url"], ra, dec, fov, v["path"])
        except (RuntimeError, requests.RequestException) as err:
            # irsa is often busy; one lost visit must not kill the run, a rerun fetches it later
            print(f"skipped visit: {err}")
    got = [v for v in visits if v["path"].exists()]
    if not got:
        raise SystemExit(f"no {detector} cutouts for {t['name']}, irsa busy: rerun later")
    print(f"{len(got)}/{len(visits)} visits on disk")
    out_dir = settings.WEB_DIR / "cache" / slug / detector
    return render_passes(got, ra, dec, fov, out_dir)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", required=True)
    ap.add_argument("--detector", required=True)
    args = ap.parse_args()
    for n, m in enumerate(run(args.target, args.detector), start=1):
        r = m["date_range"]
        print(f"pass-{n}: {m['visit_count']} visits, {r['start']} to {r['end']}")
