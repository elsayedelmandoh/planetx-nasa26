import json
from pathlib import Path

import pytest
from src.utils.data_acquisition import center_slug, cutout_size_deg
from src.utils.data_processing import propagate, render_passes

FIX = Path(__file__).resolve().parents[1] / "fixtures"
BARNARD = {"ra_deg": 269.452075, "dec_deg": 4.693364, "name": "Barnard's Star",
           "astrometry": {"ra_deg": 269.44850252543836, "dec_deg": 4.739420051112412,
                          "pmra_mas_yr": -801.5509783684709, "pmdec_mas_yr": 10362.394206546573,
                          "epoch": 2016.0, "source": "gaia dr3 4472832130942575872"}}
# pmra = 0, pmdec = 6150 mas/yr = 6.15 arcsec/yr = 1 native px/yr in dec
SYNTH = {"ra_deg": 133.795129, "dec_deg": -7.245147, "name": "synth",
         "astrometry": {"ra_deg": 133.795129, "dec_deg": -7.245147,
                        "pmra_mas_yr": 0.0, "pmdec_mas_yr": 6150.0,
                        "epoch": 2016.0, "source": "test"}}


def test_propagate_moves_north_at_the_gaia_rate() -> None:
    ra, dec = propagate(BARNARD, 2017.0)
    assert (dec - BARNARD["astrometry"]["dec_deg"]) * 3600 == pytest.approx(10.362, abs=0.5)


def test_propagate_barnard_2016_to_2026_moves_103_6_arcsec_dec() -> None:
    ra, dec = propagate(BARNARD, 2026.0)
    assert (dec - BARNARD["astrometry"]["dec_deg"]) * 3600 == pytest.approx(103.624, abs=0.5)


def test_propagate_without_astrometry_is_unchanged() -> None:
    t = {"ra_deg": 133.795129, "dec_deg": -7.245147, "name": "x"}
    assert propagate(t, 2026.0) == (pytest.approx(133.795129), pytest.approx(-7.245147))


def test_cutout_size_is_1_5x_fov() -> None:
    assert cutout_size_deg(5) == pytest.approx(1.5 * 5 / 60)


def test_center_slug_strips_minus_signs_and_tags_size() -> None:
    assert center_slug(133.7951, -7.2451) == "133.7951_m7.2451"
    assert center_slug(133.7951, -7.2451, 0.125) == "133.7951_m7.2451_0.1250"


def test_render_passes_writes_frame_center(tmp_path) -> None:
    visits = [
        {"mjd": m, "path": FIX / f"pass{i}.fits"}
        for i, m in enumerate((60000.0, 60001.0, 60002.0), start=1)
    ]

    metas = render_passes(visits, 133.795129, -7.245147, 1, tmp_path, frame_epoch_mjd=60001.0)

    meta = json.loads((tmp_path / "pass-1.json").read_text())
    assert meta["frame_center"]["ra_deg"] == 133.795129
    assert meta["frame_center"]["dec_deg"] == -7.245147
    assert meta["frame_center"]["mjd"] == 60001.0
    assert meta["frame_center"]["epoch"] == "2023-02-26"
    assert meta["center_ra_deg"] == 133.795129
    assert meta["center_dec_deg"] == -7.245147
    assert meta["center_epoch"] == pytest.approx(2023.15, abs=0.01)
    assert metas[0]["frame_center"]["ra_deg"] == 133.795129


def test_render_passes_target_px_moves_by_pm_over_time(tmp_path) -> None:
    from astropy.time import Time

    mjds = (60000.0, 62057.5)  # two passes ~5.65 yr apart
    visits = [
        {"mjd": m, "path": FIX / f"pass{n}.fits"} for n, m in enumerate(mjds, start=1)
    ]

    metas = render_passes(visits, 133.795129, -7.245147, 1, tmp_path, target=SYNTH)

    dt_yr = Time(mjds[1], format="mjd").jyear - Time(mjds[0], format="mjd").jyear
    dy = metas[1]["target_px"][1] - metas[0]["target_px"][1]  # dec increases upward in dec pixels
    assert dy == pytest.approx(dt_yr * 1.0, abs=0.05)  # 6150 mas/yr / 6.15 arcsec per px
    assert metas[0]["target_px"][0] == pytest.approx(metas[1]["target_px"][0], abs=0.05)
    assert metas[0]["astrometry_source"] == "test"
    for m in metas:
        assert "target_epoch" in m and "target_px" in m


def test_render_passes_without_astrometry_has_no_target_px(tmp_path) -> None:
    visits = [{"mjd": 60000.0, "path": FIX / "pass1.fits"}]
    target = {"ra_deg": 133.795129, "dec_deg": -7.245147, "name": "x"}

    metas = render_passes(visits, 133.795129, -7.245147, 1, tmp_path, target=target)

    assert "target_px" not in metas[0]
    assert "target_epoch" not in metas[0]
    assert "astrometry_source" not in metas[0]
