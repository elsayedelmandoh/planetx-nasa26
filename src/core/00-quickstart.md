# src/core quickstart

**propose:** load typed settings once and expose them everywhere.

**input:** `.env` (environment variables) over `configs/default.yaml`.

**output:** a `settings` object with resolved paths, provider config, and thresholds.

**structure:**
- `settings.py` -- `Settings` class, one field per setting (yaml value, env var overrides), plus resolved paths
- `logger.py` -- file and console logging, json mode for shipping

**rule:** `src/core/` is the loader; the values live in `configs/*.yaml`.

**rules:**
- never hardcode a path, threshold, or key. add a field to `settings.py` and read it from there.
- secrets come from env vars only. `.env` stays out of git.
- secret fields (api keys, tokens) are `SecretStr`, never plain `str`, so they cannot leak into logs or `model_dump()`.
- path fields are plain fields, not private `_REL` attributes, so `configs/*.yaml` can override them. pydantic treats a leading underscore as a private attribute and ignores it in every config source.
