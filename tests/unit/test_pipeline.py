import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image
from src.utils import data_acquisition as acq
from src.utils.data_processing import (
    UPSAMPLE_FACTOR,
    bad_mask,
    coadd_pass,
    common_wcs,
    group_into_passes,
    render_passes,
    write_png,
)

FIX = Path(__file__).resolve().parents[1] / "fixtures"
RA, DEC = 133.795129, -7.245147


def test_group_into_passes_splits_on_gap_over_60_days() -> None:
    visits = [{"mjd": m} for m in (100, 101, 130, 300, 301, 500)]

    passes = group_into_passes(visits)

    assert [len(p) for p in passes] == [3, 2, 1]


def test_bad_mask_masks_transient_keeps_source() -> None:
    hdr = fits.Header(
        {"MSKN0000": "TRANSIENT", "MSKM0000": 1, "MSKN0021": "SOURCE", "MSKM0021": 2097152}
    )
    flags = np.array([0, 1, 2097152, 1 | 2097152])

    assert bad_mask(flags, hdr).tolist() == [False, True, False, True]


def test_coadd_is_nanmedian_over_visits(monkeypatch) -> None:
    wcs, shape = common_wcs(RA, DEC, 1)
    vals = {"a": 1.0, "b": 2.0, "c": 9.0}
    monkeypatch.setattr(
        "src.utils.data_processing.reproject_interp",
        lambda src, *_, **__: np.full(shape, src[0]),
    )
    monkeypatch.setattr("src.utils.data_processing.load_masked", lambda p: (vals[p], None))

    out = coadd_pass(["a", "b", "c"], wcs, shape)

    assert np.all(out == 2.0)


def test_write_png_is_upsampled_8bit(tmp_path) -> None:
    img = np.random.default_rng(0).normal(size=(10, 12)).astype(np.float32)
    img[0, 0] = np.nan

    write_png(img, tmp_path / "x.png")

    im = Image.open(tmp_path / "x.png")
    assert im.size == (48, 40) and im.mode == "L"


def test_fixture_end_to_end_with_network_monkeypatched(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(
        acq.requests,
        "get",
        lambda *a, **k: type(
            "R",
            (),
            {"content": (FIX / "sia_d6.xml").read_bytes(), "raise_for_status": lambda s: None},
        )(),
    )
    visits = acq.query_sia_visits(RA, DEC, "d6", ["spherex_dr1"])
    for v, n in zip(visits, (1, 2, 3), strict=True):
        v["path"] = FIX / f"pass{n}.fits"

    metas = render_passes(visits, RA, DEC, 1, tmp_path)

    assert [m["visit_count"] for m in metas] == [1, 1, 1]
    for n in (1, 2, 3):
        meta = json.loads((tmp_path / f"pass-{n}.json").read_text())
        assert meta["stretch"] == "zscale" and meta["upsample_factor"] == 4
        assert set(meta["date_range"]) == {"start", "end"}
        assert Image.open(tmp_path / f"pass-{n}.png").size == (
            meta["width"] * 4,
            meta["height"] * 4,
        )
    assert metas[0]["date_range"]["start"] == "2025-05-05"


def test_difference_image_single_pixel_shift() -> None:
    from src.utils.data_processing import difference_image

    a = np.zeros((8, 8), dtype=np.float32)
    b = np.zeros((8, 8), dtype=np.float32)
    a[4, 4] = 10.0
    b[4, 5] = 10.0

    diff = difference_image(a, b)

    assert diff[4, 4] == np.float32(-10.0)  # negative lobe at old position
    assert diff[4, 5] == np.float32(10.0)  # positive lobe at new position


def test_difference_image_propagates_nan() -> None:
    from src.utils.data_processing import difference_image

    a = np.array([[1.0, np.nan]], dtype=np.float32)
    b = np.array([[2.0, 3.0]], dtype=np.float32)

    diff = difference_image(a, b)

    assert diff[0, 0] == np.float32(-0.5)  # (2 - median(b)) - (1 - median(a))
    assert np.isnan(diff[0, 1])


def test_write_diff_png_zero_is_mid_gray(tmp_path) -> None:
    from src.utils.data_processing import write_diff_png

    img = np.zeros((4, 4), dtype=np.float32)
    img[0, 0] = np.nan

    write_diff_png(img, tmp_path / "d.png")

    im = Image.open(tmp_path / "d.png")
    assert im.size == (16, 16) and im.mode == "L"
    assert np.array(im)[0, 0] == 127 or np.array(im)[0, 0] == 128


def test_difference_image_constant_offset_gives_zero() -> None:
    from src.utils.data_processing import difference_image

    rng = np.random.default_rng(1)
    base = rng.normal(size=(20, 20)).astype(np.float32)
    base[3, 3] = np.nan
    a = base + 100.0
    b = base + 250.0  # differs only by a constant background offset

    diff = difference_image(a, b)

    finite = diff[np.isfinite(diff)]
    assert np.allclose(finite, 0.0, atol=1e-4)  # float32 rounding


def test_write_png_fills_enclosed_nan_holes_white(tmp_path) -> None:
    img = np.ones((9, 9), dtype=np.float32)
    img[4:6, 4:6] = np.nan  # saturated core hole
    img[0, 0] = np.nan  # outside footprint border nan

    n = write_png(img, tmp_path / "holes.png")

    assert n == 4
    im = np.asarray(Image.open(tmp_path / "holes.png"))
    up = UPSAMPLE_FACTOR
    assert (im[4 * up:6 * up, 4 * up:6 * up] == 255).all()
    assert im[0, 0] == 0


def test_cap_passes_spreads_evenly_and_leaves_small_passes() -> None:
    big = [{"mjd": float(m)} for m in range(100)]
    small = [{"mjd": 1000.0}, {"mjd": 1001.0}]

    capped = acq.cap_passes([big, small], 25)

    assert len(capped[0]) == 25
    idx = [int(round(i)) for i in np.linspace(0, 99, 25)]
    assert [v["mjd"] for v in capped[0]] == [big[i]["mjd"] for i in idx]
    assert capped[1] == small


def test_download_visits_parallel_once_and_skips_failures(monkeypatch, tmp_path) -> None:
    calls = []

    def fake_download(url, ra, dec, size_deg, dest):
        calls.append(url)
        if "bad" in url:
            raise RuntimeError("server busy")
        dest.write_bytes(b"SIMPLE")

    monkeypatch.setattr(acq, "download_cutout", fake_download)
    names = ("a", "b", "bad", "c")
    visits = [{"url": f"http://x/{n}", "path": tmp_path / n} for n in names]

    acq.download_visits(visits, 1.0, 2.0, 0.1)  # must not raise

    assert sorted(calls) == sorted(v["url"] for v in visits)
    assert (tmp_path / "a").exists() and (tmp_path / "c").exists()
    assert not (tmp_path / "bad").exists()
