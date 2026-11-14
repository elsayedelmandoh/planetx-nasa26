import pytest
from src.core.settings import settings


@pytest.fixture(autouse=True)
def isolated_data_dir(tmp_path, monkeypatch):
    # tests must never write into the real data/ folder (it feeds model training)
    monkeypatch.setattr(settings, "DATA_REL", tmp_path / "data")
