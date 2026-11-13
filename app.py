"""propose: application entrypoint -- run this to execute the full project lifecycle.
input: .env, configs/default.yaml.
output: prints project name and environment. the web tool runs via `make serve`."""

from src.core.settings import settings


def main() -> int:
    """run the application entrypoint."""
    print(f"project: {settings.PROJECT_NAME}")
    print(f"environment: {settings.ENV}")
    return 0


if __name__ == "__main__":
    main()


