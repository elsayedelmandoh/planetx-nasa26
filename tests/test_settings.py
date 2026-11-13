from pydantic_settings import SettingsConfigDict
from src.core.settings import Settings


def test_create_required_directories_creates_all_paths(tmp_path) -> None:
    settings = Settings(BASE_DIR=tmp_path)

    settings.create_required_directories()

    expected = [
        settings.DATA_DIR,
        settings.LOGS_DIR,
        settings.FIGURES_DIR,
        settings.EVALS_DIR,
    ]
    for path in expected:
        assert (tmp_path / path).exists(), f"{path} not created"
    assert settings.FIGURES_DIR == tmp_path / "evals" / "figures"


def test_env_overrides_yaml_value(tmp_path, monkeypatch) -> None:
    (tmp_path / "v.yaml").write_text("PROJECT_NAME: from-yaml\nENV: from-yaml\n")

    class YamlSettings(Settings):
        model_config = SettingsConfigDict(
            yaml_file=tmp_path / "v.yaml", env_file=None, extra="ignore"
        )

    monkeypatch.setenv("ENV", "from-env")
    loaded = YamlSettings(BASE_DIR=tmp_path)

    assert loaded.PROJECT_NAME == "from-yaml"
    assert loaded.ENV == "from-env"
