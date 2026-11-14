import json
import math
from pathlib import Path

import pytest
from src.utils.data_acquisition import center_slug, target_now
from src.utils.data_processing import POS_EPOCH_MJD, propagate_proper_motion, render_passes

FIX = Path(__file__).resolve().parents[1] / "fixtures"
BARNARD = {"ra_deg": 269.452075, "dec_deg": 4.693364,
           "pm_ra_cosdec_masyr": -801.55, "pm_dec_masyr": 10362.39,
           "name": "Barnard's Star"}


def test_propagate_moves_north_at_the_gaia_rate() -> None:
    ra, dec = propagate_proper_motion(*[BARNARD[k] for k in ("ra_deg", "dec_deg")],
                                      BARNARD["pm_ra_cosdec_masyr"], BARNARD["pm_dec_masyr"], 1.0)
    assert dec - BARNARD["dec_deg"] == pytest.approx(10362.39 / 3600 / 1000, abs=1e-9)
    assert ra - BARNARD["ra_deg"] == pytest.approx(
        -801.55 / 3600 / 1000 / math.cos(math.radians(4.693364)), abs=1e-9
    )


def test_barnard_drift_over_26_years_is_about_4_5_arcmin() -> None:
    ra, dec = propagate_proper_motion(BARNARD["ra_deg"], BARNARD["dec_deg"],
                                      BARNARD["pm_ra_cosdec_masyr"], BARNARD["pm_dec_masyr"], 26.0)
    dist_arcmin = math.hypot(
        (ra - BARNARD["ra_deg"]) * math.cos(math.radians(BARNARD["dec_deg"])) * 60,
        (dec - BARNARD["dec_deg"]) * 60,
    )
    assert dist_arcmin == pytest.approx(4.5, abs=0.1)


def test_target_now_uses_j2000_reference() -> None:
    ra, dec = target_now(BARNARD, POS_EPOCH_MJD)
    assert (ra, dec) == (pytest.approx(BARNARD["ra_deg"]), pytest.approx(BARNARD["dec_deg"]))


def test_target_now_requires_proper_motion() -> None:
    with pytest.raises(SystemExit):
        target_now({"name": "x", "ra_deg": 1.0, "dec_deg": 2.0}, POS_EPOCH_MJD)


def test_center_slug_strips_minus_signs() -> None:
    assert center_slug(133.7951, -7.2451) == "133.7951_m7.2451"


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
    assert metas[0]["frame_center"]["ra_deg"] == 133.795129
