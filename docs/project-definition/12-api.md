# http api contract

the contract between the service and its callers. one entry per endpoint.

## endpoints

- `GET /health` -- is it up, which data release
  - request: none
  - response: `{"status": "ok", "data_release": "qr2"}`
  - errors: none
  - auth: none
- `GET /api/targets` -- the 5 benchmark targets, used as preset buttons
  - request: none
  - response: `[{"name": "WISE 0855", "ra_deg": 133.795129, "dec_deg": -7.245147, "kind": "..."}, ...]`
  - errors: none (empty list when configs has no targets)
  - auth: none
- `GET /` -- the web frontend (`web/index.html`), static files
  - errors: 404 for a missing file
  - auth: none

## planned

- `GET /api/cutouts?ra=&dec=&fov=` -- multi-epoch spherex cutouts for one patch
  - errors: 422 bad coordinates, 404 no coverage, 502 irsa unreachable

## rules

- one entry per endpoint: method, path, request shape, response shape, failure modes.
- the contract changes with the code, in the same commit.
- no endpoint without a documented failure mode.
- auth, if any, is stated per endpoint.
