# planetx-nasa26

public web tool to blink spherex sky images over time, so anyone can spot moving and variable objects. built for the 2026 nasa space apps challenge "planet x and spherex".

## run

1. `cp .env.example .env`
2. `uv sync`
3. `make serve`
4. open http://localhost:8000/

`make test` runs the tests, `make eval` runs the offline gate.

## what goes where

| path | holds |
|---|---|
| `web/` | the frontend: `index.html` (ra/dec input, fov, presets, blink player) |
| `src/api/` | fastapi app and routes, serves `web/` at `/` |
| `src/core/` | settings loader (`configs/*.yaml` + `.env`), logging |
| `src/utils/` | coordinate parsing, data acquisition and processing helpers |
| `src/evals/` | offline eval gate runner (stub for now) |
| `configs/` | values: data release, fov presets, benchmark targets |
| `data/` | `raw/` downloads (not shipped), `processed/` cached cutouts, `samples/` small fixtures |
| `evals/` | benchmark notes and figures |
| `notebooks/` | exploration: data acquisition, eda, data processing |
| `tests/` | unit, integration. offline by default |
| `docs/project-definition/` | problem, goal, architecture, api contract, decision log |
| `docs/.internal/` | agent plans and notes, not product docs |
| `.github/workflows/` | ci (lint, test, eval gate) and image push |

every folder holds an `00-quickstart.md` with the details for that folder.

## benchmark targets

| target | ra (deg) | dec (deg) | kind |
|---|---:|---:|---|
| WISE 0855 | 133.795129 | -7.245147 | fast-moving brown dwarf |
| Barnard's Star | 269.452075 | +4.693364 | high proper-motion red dwarf |
| Epsilon Indi B | 331.044147 | -56.782844 | binary brown dwarfs |
| RW Aurigae | 76.956375 | +30.401389 | variable star |
| R Draconis | 248.167625 | +66.755000 | variable star |

values live in `configs/default.yaml` and load as preset buttons from `GET /api/targets`.

## data credit

spherex data: NASA / JPL-Caltech / IPAC via IRSA. doi: [10.26131/IRSA652](https://doi.org/10.26131/IRSA652).
