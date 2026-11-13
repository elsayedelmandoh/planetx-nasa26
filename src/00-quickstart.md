# src quickstart

**propose:** hold the application code, one package per concern.

**input:** ra/dec requests, spherex cutouts, settings.

**output:** a running web service, eval reports, and logs.

**structure:**
- `core/` -- settings loader (`configs/*.yaml` + `.env`), logging setup
- `api/` -- fastapi app, routes, serves `web/` at `/`
- `evals/` -- offline eval gate runner (stub for now)
- `utils/` -- shared helpers, coordinate parsing, data acquisition and processing

> imports follow the repo convention: `from src.core.settings import settings`.
