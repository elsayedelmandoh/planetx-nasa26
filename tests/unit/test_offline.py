"""offline rerun tests: sia fallback to cached visits.json and --offline mode."""

import json
import shutil
from pathlib import Path

import pytest
import requests
from astropy.time import Time
from src.core.settings import settings
from src.utils import data_acquisition as acq
from src.utils.data_processing import propagate

FIX = Path(__file__).resolve().parents[1] / "fixtures"
TARGET = "WISE 0855"
DET = "d6"
MJD = [60800.0, 61200.0, 61600.0]


def target_cfg() -> dict:
    return next(t for t in settings.TARGETS if t["name"] == TARGET)


def cached_visits() -> list[dict]:
    return [
        {"mjd": m, "url": f"https://example.test/pass{i + 1}.fits", "release": "spherex_dr1"}
        for i, m in enumerate(MJD)
    ]


def seed_cache(tmp_path, monkeypatch, with_cutouts=True):
    monkeypatch.setattr(settings, "WEB_REL", tmp_path / "web")
    monkeypatch.setattr(acq.time, "sleep", lambda *_: None)
    t = target_cfg()
    slug = acq.slugify(t["name"])
    visits = cached_visits()
    mean_mjd = sum(v["mjd"] for v in visits) / len(visits)
    year = Time(mean_mjd, format="mjd").jyear
    ra_c, dec_c = propagate(t, year)
    ctr = acq.center_slug(ra_c, dec_c, acq.cutout_size_deg(settings.DEFAULT_FOV_ARCMIN))
    raw_dir = settings.DATA_DIR / "raw" / slug / DET
    raw_dir.mkdir(parents=True)
    cache = {
        acq.center_slug(t["ra_deg"], t["dec_deg"]): visits,
        acq.center_slug(ra_c, dec_c): visits,
    }
    (raw_dir / "visits.json").write_text(json.dumps(cache))
    if with_cutouts:
        for i in range(1, 4):
            shutil.copy(FIX / f"pass{i}.fits", raw_dir / f"{ctr}_pass{i}.fits")
    return slug


def test_run_falls_back_to_cached_visits(tmp_path, monkeypatch, capsys):
    slug = seed_cache(tmp_path, monkeypatch)

    def boom(*a, **k):
        raise requests.ConnectTimeout("timed out")

    monkeypatch.setattr(acq.requests, "get", boom)
    metas = acq.run(TARGET, DET)
    out = capsys.readouterr().out
    assert "irsa unreachable: using cached visit list (3 visits)" in out
    assert [m["visit_count"] for m in metas] == [1, 1, 1]
    assert (settings.WEB_DIR / "cache" / slug / DET / "pass-1.png").exists()


def test_run_without_cache_exits_with_clear_message(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "WEB_REL", tmp_path / "web")
    monkeypatch.setattr(acq.time, "sleep", lambda *_: None)

    def boom(*a, **k):
        raise requests.ConnectTimeout("timed out")

    monkeypatch.setattr(acq.requests, "get", boom)
    with pytest.raises(SystemExit, match="irsa unreachable"):
        acq.run(TARGET, DET)


def test_offline_never_calls_requests_get(tmp_path, monkeypatch):
    slug = seed_cache(tmp_path, monkeypatch)

    def boom(*a, **k):
        raise AssertionError("network touched in --offline mode")

    monkeypatch.setattr(acq.requests, "get", boom)
    metas = acq.run(TARGET, DET, offline=True)
    assert [m["visit_count"] for m in metas] == [1, 1, 1]
    assert (settings.WEB_DIR / "cache" / slug / DET / "pass-1.png").exists()


def test_offline_without_cache_exits_with_clear_message(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "WEB_REL", tmp_path / "web")

    def boom(*a, **k):
        raise AssertionError("network touched in --offline mode")

    monkeypatch.setattr(acq.requests, "get", boom)
    with pytest.raises(SystemExit, match="--offline: no cached visit list"):
        acq.run(TARGET, DET, offline=True)
