"""propose: turn raw spherex cutouts into per-pass coadd frames (png + json).
input: ra/dec strings, visit dicts {"mjd", "path"} pointing at level 2 fits cutouts.
output: web/cache/<target-slug>/<detector>/pass-<n>.png + .json."""

import json
from pathlib import Path

import astropy.units as u
import numpy as np
from astropy.coordinates import SkyCoord
from astropy.io import fits
from astropy.time import Time
from astropy.visualization import ZScaleInterval
from astropy.wcs import WCS
from PIL import Image
from reproject import reproject_interp

NATIVE_PIXEL_SCALE_ARCSEC = 6.15
UPSAMPLE_FACTOR = 4
PASS_GAP_DAYS = 60
# flag planes that make a pixel unusable. SOURCE, OUTLIER, OVERFLOW are kept on purpose
# (SOURCE marks the target itself). bit values come from the MSKN/MSKM cards of the flags hdu.
BAD_FLAG_NAMES = (
    "TRANSIENT", "SUR_ERROR", "NONFUNC", "MISSING_DATA", "HOT", "COLD",
    "PERSIST", "STREAK", "BLOOM", "SNOWBALL", "HALO",
)  # fmt: skip


def parse_coords(ra: str, dec: str) -> tuple[float, float]:
    """parse ra/dec as decimal degrees or sexagesimal ("08h 55m 10.831s", "-07d 14m 42.53s")."""
    try:
        coord = SkyCoord(float(ra), float(dec), unit=(u.deg, u.deg))
    except ValueError:
        coord = SkyCoord(ra, dec, unit=(u.hourangle, u.deg))
    return float(coord.ra.deg), float(coord.dec.deg)


def group_into_passes(visits: list[dict], gap_days: float = PASS_GAP_DAYS) -> list[list[dict]]:
    """sort visits by mjd and start a new pass at every time gap larger than gap_days."""
    passes: list[list[dict]] = []
    for v in sorted(visits, key=lambda v: v["mjd"]):
        if passes and v["mjd"] - passes[-1][-1]["mjd"] <= gap_days:
            passes[-1].append(v)
        else:
            passes.append([v])
    return passes


def bad_mask(flags: np.ndarray, flags_header: fits.Header) -> np.ndarray:
    """true where any bad flag plane is set."""
    bits = 0
    for key, name in flags_header.items():
        if key.startswith("MSKN") and name in BAD_FLAG_NAMES:
            bits |= int(flags_header["MSKM" + key[4:]])
    return (flags.astype(np.int64) & bits) != 0


def common_wcs(ra: float, dec: float, fov_arcmin: float) -> tuple[WCS, tuple[int, int]]:
    """tangent plane wcs centered on the target at the native pixel scale."""
    n = int(np.ceil(fov_arcmin * 60 / NATIVE_PIXEL_SCALE_ARCSEC))
    w = WCS(naxis=2)
    w.wcs.ctype = ["RA---TAN", "DEC--TAN"]
    w.wcs.crval = [ra, dec]
    w.wcs.crpix = [(n + 1) / 2, (n + 1) / 2]
    w.wcs.cdelt = [-NATIVE_PIXEL_SCALE_ARCSEC / 3600, NATIVE_PIXEL_SCALE_ARCSEC / 3600]
    return w, (n, n)


def load_masked(path: Path) -> tuple[np.ndarray, WCS]:
    """read image and wcs from a cutout, masked pixels set to nan."""
    with fits.open(path) as hdul:
        img = hdul["IMAGE"].data.astype(np.float32)
        img[bad_mask(hdul["FLAGS"].data, hdul["FLAGS"].header)] = np.nan
        return img, WCS(hdul["IMAGE"].header)


def coadd_pass(paths: list[Path], wcs: WCS, shape: tuple[int, int]) -> np.ndarray:
    """reproject each cutout onto the common wcs, then nanmedian across visits."""
    frames = []
    for p in paths:
        img, w = load_masked(p)
        frames.append(reproject_interp((img, w), wcs, shape_out=shape, return_footprint=False))
    return np.nanmedian(np.stack(frames), axis=0)


def write_png(img: np.ndarray, path: Path) -> None:
    """zscale stretch, 4x nearest-neighbour upsample for display, 8-bit png. nan pixels black."""
    lo, hi = ZScaleInterval().get_limits(img[np.isfinite(img)])
    scaled = np.clip((np.nan_to_num(img, nan=lo) - lo) / max(hi - lo, 1e-12), 0, 1)
    up = np.kron(scaled, np.ones((UPSAMPLE_FACTOR, UPSAMPLE_FACTOR)))
    Image.fromarray((up * 255).astype(np.uint8), mode="L").save(path)


def difference_image(coadd_a: np.ndarray, coadd_b: np.ndarray) -> np.ndarray:
    """epoch b minus epoch a with each coadd's own background removed. propagates nan."""
    a = coadd_a.astype(np.float32) - np.nanmedian(coadd_a)
    b = coadd_b.astype(np.float32) - np.nanmedian(coadd_b)
    return b - a


def write_diff_png(img: np.ndarray, path: Path) -> None:
    """zero-centered symmetric stretch, 4x upsample. nan pixels mid gray."""
    finite = img[np.isfinite(img)]
    mad = np.median(np.abs(finite - np.median(finite))) if finite.size else 0.0
    sigma = 1.4826 * mad
    limit = 5 * sigma if sigma > 0 else 1.0
    scaled = np.clip((np.nan_to_num(img, nan=0.0) / limit) * 0.5 + 0.5, 0, 1)
    up = np.kron(scaled, np.ones((UPSAMPLE_FACTOR, UPSAMPLE_FACTOR)))
    Image.fromarray((up * 255).astype(np.uint8), mode="L").save(path)


def epoch_label(start: str, end: str) -> str:
    """survey pass label from its date range: "2025-08/10", or "2025-05" for one month."""
    if start[:7] == end[:7]:
        return start[:7]
    if start[:4] == end[:4]:
        return f"{start[:7]}/{end[5:7]}"
    return f"{start[:7]}/{end[:7]}"


def render_passes(
    visits: list[dict], ra: float, dec: float, fov_arcmin: float, out_dir: Path
) -> list[dict]:
    """group visits into passes, coadd each, write pass-<n>.png + .json into out_dir."""
    out_dir.mkdir(parents=True, exist_ok=True)
    wcs, shape = common_wcs(ra, dec, fov_arcmin)
    metas = []
    coadds = []
    groups = group_into_passes(visits)
    for n, group in enumerate(groups, start=1):
        img = coadd_pass([v["path"] for v in group], wcs, shape)
        coadds.append(img)
        write_png(img, out_dir / f"pass-{n}.png")
        start, end = (Time(group[i]["mjd"], format="mjd").strftime("%Y-%m-%d") for i in (0, -1))
        meta = {
            "epoch_label": epoch_label(start, end),
            "date_range": {"start": start, "end": end},
            "visit_count": len(group),
            "stretch": "zscale",
            "width": shape[1],
            "height": shape[0],
            "native_pixel_scale_arcsec": NATIVE_PIXEL_SCALE_ARCSEC,
            "upsample_factor": UPSAMPLE_FACTOR,
        }
        (out_dir / f"pass-{n}.json").write_text(json.dumps(meta, indent=2) + "\n")
        metas.append(meta)
    for a in range(len(groups) - 1):
        b = a + 1
        label_a = metas[a]["epoch_label"]
        label_b = metas[b]["epoch_label"]
        diff = difference_image(coadds[a], coadds[b])
        write_diff_png(diff, out_dir / f"diff-{a + 1}-{b + 1}.png")
        meta = {
            "kind": "difference",
            "subtraction": f"pass-{b + 1} - pass-{a + 1}",
            "epoch_label": f"{label_b} minus {label_a}",
            "stretch": "symmetric",
            "width": shape[1],
            "height": shape[0],
            "native_pixel_scale_arcsec": NATIVE_PIXEL_SCALE_ARCSEC,
            "upsample_factor": UPSAMPLE_FACTOR,
        }
        (out_dir / f"diff-{a + 1}-{b + 1}.json").write_text(json.dumps(meta, indent=2) + "\n")
    return metas
