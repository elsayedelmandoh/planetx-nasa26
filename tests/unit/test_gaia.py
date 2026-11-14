"""offline tests for the gaia dr3 cross-match in data_acquisition."""

import requests
from src.utils import data_acquisition as da


class FakeResp:
    ok = True
    status_code = 200
    text = (
        "ra,dec,pmra,pmdec,phot_g_mean_mag\n"
        "100.0,20.0,1.5,-2.5,12.3\n"
        "100.1,20.1,,,15.0\n"
    )
    content = text.encode()


def test_gaia_stars_parses_csv_and_nan_pm_to_zero(monkeypatch):
    monkeypatch.setattr(da.requests, "get", lambda *a, **k: FakeResp())
    stars = da.gaia_stars(100.0, 20.0, 0.1)
    assert len(stars) == 2
    assert stars[0]["pmra"] == 1.5 and stars[0]["g"] == 12.3
    assert stars[1]["pmra"] == 0.0 and stars[1]["pmdec"] == 0.0


def test_gaia_stars_unreachable_returns_empty_list(monkeypatch):
    def boom(*a, **k):
        raise requests.ConnectionError("no route to host")

    monkeypatch.setattr(da.requests, "get", boom)
    monkeypatch.setattr(da.time, "sleep", lambda *_: None)
    assert da.gaia_stars(100.0, 20.0, 0.1) == []
