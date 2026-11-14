import re

from fastapi.testclient import TestClient
from src.api.app import app

client = TestClient(app)


def test_root_serves_coordinate_controls_and_presets() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert '<input id="ra"' in response.text
    assert '<input id="dec"' in response.text
    assert '<select id="fov"' in response.text
    assert '<div id="presets"' in response.text
    assert 'aria-live="polite"' in response.text


def test_root_contains_blink_player_controls() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert 'id="play-toggle"' in response.text
    assert 'id="speed"' in response.text
    assert 'id="scrub"' in response.text
    assert 'id="det"' in response.text


def test_cache_index_json_served_and_matches_contract() -> None:
    response = client.get("/cache/index.json")

    assert response.status_code == 200
    target = next(t for t in response.json()["targets"] if t["slug"] == "wise-0855")
    assert target["name"] == "WISE 0855"
    assert target["ra_deg"] == 133.795129
    assert target["dec_deg"] == -7.245147
    assert target["kind"] == "fast-moving brown dwarf"
    frames = target["detectors"]["d6"]
    assert [f["png"] for f in frames] == [f"cache/wise-0855/d6/pass-{n}.png" for n in (1, 2, 3)]
    assert [f["json"] for f in frames] == [f"cache/wise-0855/d6/pass-{n}.json" for n in (1, 2, 3)]


def test_home_and_team_served_and_clean() -> None:
    for page in ("home.html", "team.html"):
        response = client.get(f"/{page}")

        assert response.status_code == 200
        assert not re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}", response.text)
        assert "—" not in response.text
        assert 'href="index.html"' in response.text
