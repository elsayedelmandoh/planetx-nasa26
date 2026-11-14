from fastapi.testclient import TestClient
from src.api.app import app

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_lists_the_active_data_releases() -> None:
    response = client.get("/health")

    assert response.json()["data_releases"] == ["spherex_dr1", "spherex_qr3"]


def test_targets_lists_the_5_benchmark_targets() -> None:
    response = client.get("/api/targets")

    names = {t["name"] for t in response.json()}
    assert response.status_code == 200
    assert names == {"WISE 0855", "Barnard's Star", "Epsilon Indi B", "RW Aurigae", "R Draconis"}


def test_root_serves_web_frontend() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert "spherex sky blink" in response.text
