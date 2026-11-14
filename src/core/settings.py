"""
propose: load typed settings from configs/default.yaml and .env, provide absolute paths.
input: .env (env vars, highest priority), configs/default.yaml (values, lower priority).
output: Settings singleton with resolved absolute paths.
"""

from pathlib import Path

from pydantic import computed_field
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)


class Settings(BaseSettings):
    """holds strongly-typed configuration: yaml values under .env overrides."""

    BASE_DIR: Path = Path(__file__).resolve().parents[2]

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        yaml_file=Path(__file__).resolve().parents[2] / "configs" / "default.yaml",
        extra="ignore",
        case_sensitive=False,
    )

    PROJECT_NAME: str = "my-project"
    ENV: str = "development"

    # sky data values, set in configs/default.yaml
    DATA_RELEASES: list[str] = ["spherex_dr1", "spherex_qr3"]
    FOV_PRESETS_ARCMIN: list[float] = [2, 5, 15, 30]
    DEFAULT_FOV_ARCMIN: float = 5
    TARGETS: list[dict] = []

    # relative targets, overridable from configs/default.yaml
    DATA_REL: Path = Path("data")
    CONFIGS_REL: Path = Path("configs")
    LOGS_REL: Path = Path("logs")
    EVALS_REL: Path = Path("evals")
    FIGURES_REL: Path = Path("evals/figures")
    WEB_REL: Path = Path("web")

    @classmethod
    def settings_customise_sources(
        cls, settings_cls, init_settings, env_settings, dotenv_settings, **_
    ):
        # priority: init > env > .env > yaml
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            YamlConfigSettingsSource(settings_cls),
        )

    # Exposed strongly-typed absolute paths
    @computed_field
    @property
    def CONFIGS_DIR(self) -> Path:
        return self.BASE_DIR / self.CONFIGS_REL

    @computed_field
    @property
    def EVALS_DIR(self) -> Path:
        return self.BASE_DIR / self.EVALS_REL

    @computed_field
    @property
    def DATA_DIR(self) -> Path:
        return self.BASE_DIR / self.DATA_REL

    @computed_field
    @property
    def LOGS_DIR(self) -> Path:
        return self.BASE_DIR / self.LOGS_REL

    @computed_field
    @property
    def FIGURES_DIR(self) -> Path:
        return self.BASE_DIR / self.FIGURES_REL

    @computed_field
    @property
    def WEB_DIR(self) -> Path:
        return self.BASE_DIR / self.WEB_REL

    def create_required_directories(self) -> None:
        """bootstraps essential template data structures."""
        for dir_path in [
            self.DATA_DIR,
            self.LOGS_DIR,
            self.EVALS_DIR,
            self.FIGURES_DIR,
        ]:
            dir_path.mkdir(parents=True, exist_ok=True)


# Instantiate and immediately bootstrap directory tree safely
settings = Settings()
settings.create_required_directories()
