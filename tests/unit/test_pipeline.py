import json
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image
from src.utils import data_acquisition as acq
from src.utils.data_processing import (
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
