# src/api quickstart

**propose:** expose the sky blink tool over http.

**input:** http requests from the browser.

**output:** json responses and the static web frontend.

**structure:**
- `app.py` -- fastapi app, includes the router, mounts `settings.WEB_DIR` at `/`
- `routes.py` -- the endpoints

**endpoints:**
- `GET /health` -- is it up, which data release
- `GET /api/targets` -- the 5 benchmark targets from `configs/default.yaml`
- `GET /api/cutouts` -- planned: multi-epoch cutouts for ra, dec, fov

**rules:**
- api routes are registered before the static mount so they win over files in `web/`.
- optional inbound api key via `INBOUND_API_KEY` in `.env`.
- every endpoint is documented in `docs/project-definition/12-api.md`.
