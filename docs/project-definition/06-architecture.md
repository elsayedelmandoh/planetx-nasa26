# system architecture and component boundaries

three parts, left to right: input layer, python cutout pipeline, web frontend.

## components

- input layer (`web/index.html`, `src/utils/data_processing.py`)
  - in: ra and dec (decimal degrees or sexagesimal), fov, or a benchmark preset. url state `?ra=&dec=&fov=`.
  - out: ra_deg, dec_deg, fov in arcminutes.
  - fails on: unparsable coordinates.
- python cutout pipeline (`src/utils/`, served by `src/api/`)
  - in: ra_deg, dec_deg, fov, data release from `configs/default.yaml`.
  - does: query irsa spherex cutouts across epochs, reproject to one wcs grid, stack per detector, difference and coadd.
  - out: aligned frames per epoch. state: cached cutouts in `data/processed/`.
  - fails on: irsa unreachable, no coverage for the patch, too few epochs.
- web frontend (`web/`, mounted at `/` by `src/api/app.py`)
  - in: frames from the api, targets from `GET /api/targets`.
  - out: blink player on a canvas, with the irsa credit in the footer.
  - fails on: api down, empty frame list.

## wiring

- entrypoint: `make serve` (uvicorn `src.api.app:app`). `app.py` prints project info only.
- configuration: `configs/` (values), `src/core/settings.py` (loader).
- evaluation: `src/evals/runner.py` (offline gate), `evals/` (results), `tests/`.
