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
