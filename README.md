# planetx-nasa26

<!-- screenshots: drop res1.png / res2.png into docs/results/ and uncomment
<p align="center">
  <img src="docs/results/res1.png" alt="project name - pos results" width="45%">
  &nbsp; &nbsp;
  <img src="docs/results/res2.png" alt="project name - neg results" width="45%">
</p>
-->

public web tool to blink spherex sky images over time, so anyone can spot moving and variable objects. built for the 2026 nasa space apps challenge "planet x and spherex".

live demo: https://elsayedelmandoh-planetx-nasa26.static.hf.space
space page: https://huggingface.co/spaces/elsayedelmandoh/planetx-nasa26

precompute: `uv run python -m src.utils.data_acquisition --all` (then `uv run python -m src.evals.runner --gate`)

how to adapt this template

1. replace the project name, problem statement, and goal.
2. define the dataset and constraints before implementation.
3. move repeatable logic out of notebooks and into `src/`.
4. keep tests small, deterministic, and focused on the critical path.

## table of contents

- [overview](#overview)
- [key features](#key-features)
- [setup](#setup)
  - [0. prerequisites](#0-prerequisites)
  - [1. clone the repository](#1-clone-the-repository)
  - [2. create the environment](#2-create-the-environment)
  - [3. environment variables](#3-environment-variables)
- [usage](#usage)
- [repository map](#repository-map)
- [benchmark targets](#benchmark-targets)
- [data credit](#data-credit)
- [contributing](#contributing)
- [author](#author)

## overview

**hook / problem.** nasa's spherex mission maps the whole sky every six months in 102 near-infrared bands and returns images of more than a billion objects. comets, asteroids, brown dwarfs, and variable stars reveal themselves by shifting position or brightness between epochs, but no single person can sift through that volume alone. the only route today is to pull fits files from irsa by hand and blink them in a local viewer.

**goal.** a public web tool where anyone types a right ascension and declination, picks a field of view, and watches that patch of sky blink through the spherex epochs, so a moving or variable object is obvious in seconds instead of hours.

**solution / aha moment.** the backend cuts the requested patch out of the spherex release with astropy and astroquery, stacks the epochs into a small time series, and the frontend plays them as a loop. the aha moment is the shift itself: a dot that was not there a second ago, and the tool naming it as a mover.

**results.** the repo today holds the settings loader, the coordinate parser, the api shell, the frontend shell, and the offline test suite. the cutout endpoint, the live irsa pull, and the blink playback are the next slice, and the eval gate is still a stub.

## key features

* **coordinate input:** ra and dec in decimal degrees or sexagesimal (`08h 55m 10.8s`), parsed with astropy. shipped.
* **field of view presets:** 2, 5, 15, and 30 arcmin cuts, 5 arcmin by default. shipped.
* **benchmark target presets:** the five required targets load from `configs/default.yaml` into buttons through `GET /api/targets`, so a judge can check a target in one click. shipped.
* **blink player:** a canvas that cycles the epochs of the cutout, which is where movers pop. shell only.
* **cutouts on demand:** planned next slice. pull the matching spherex epochs from irsa, cut them, and reproject them onto a common grid.
* **stacking and difference imaging:** planned. add epochs together to raise signal to noise, or subtract one epoch from another to isolate what changed.
* **102-band spectra:** planned. pull the band-pass spectrum of a selected source on the fly.
* **linkable and embeddable views:** planned. `?ra=...&dec=...&fov=...` so any cutout is shareable.

## setup

### 0. prerequisites

before running this project, ensure you have the following installed:

* [git](https://git-scm.com/)
* [uv](https://docs.astral.sh/uv/), or python 3.12 with pip
* network access to irsa for live spherex pulls, offline work needs none
* optionally [anaconda](https://www.anaconda.com/) or miniconda if you prefer a conda environment

### 1. clone the repository

```bash
git clone https://github.com/elsayedelmandoh/planetx-nasa26
cd planetx-nasa26
```

### 2. create the environment

```bash
# with uv, what the repo and ci use
uv sync

# or with conda
conda create -n planetx-nasa26 python=3.12 -y
conda activate planetx-nasa26
pip install -e . pytest httpx ruff
```

### 3. environment variables

copy the example file and fill it in. `.env` is gitignored, never commit it.

```bash
cp .env.example .env
```

| variable | default | what it does |
|---|---|---|
| `ENV` | `development` | runtime environment label |
| `LOG_LEVEL` | `INFO` | log verbosity |
| `API_HOST` | `0.0.0.0` | api bind address |
| `API_PORT` | `8000` | api port |
| `INBOUND_API_KEY` | empty | when set, requests must send `x-api-key` |

values that are not secret, the data release, the fov presets, and the benchmark targets, live in `configs/default.yaml`. `.env` overrides the yaml when both set the same key.

## usage

to run the application locally:

```bash
make serve
```

then open http://localhost:8000/

| command | what it does |
|---|---|
| `make serve` | run the fastapi app with reload on port 8000 |
| `make test` | run the offline test suite |
| `make eval` | run the offline eval gate |
| `make lint` | ruff check plus format check |
| `make format` | ruff format plus ruff autofix |

the api answers `GET /health` and `GET /api/targets`. the frontend is served from `web/` at `/`.

## repository map

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

spherex data: nasa / jpl-caltech / ipac via the nasa/ipac infrared science archive (irsa).

- spherex dr1 doi: [10.26131/IRSA678](https://doi.org/10.26131/IRSA678)
- spherex qr3 doi: [10.26131/IRSA662](https://doi.org/10.26131/IRSA662)

## contributing

contributions are welcome! if you'd like to improve this project, please follow these steps:

1. fork the repository.
2. create a branch for your feature or bug fix (`git checkout -b feature/my-new-feature`).
3. keep the repeatable logic in `src/`, not in a notebook, and add one small test for it.
4. commit your changes with clear messages (`git commit -m 'add some feature'`).
5. push to your fork (`git push origin feature/my-new-feature`).
6. make sure `make lint` and `make test` pass.
7. open a pull request.

## author

the team behind planetx-nasa26, built for the 2026 nasa space apps challenge "planet x and spherex".

| member | role |
|---|---|
| elsayed elmandoh | data engineer, research, project lead |
| youssef | web frontend |
| mostafa | research |
| salma | research |
| hazem | devops and coding |
| mohsen | graphics |

[![github](https://img.shields.io/badge/GitHub-planetx--nasa26-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/elsayedelmandoh/planetx-nasa26)
[![spaceapps](https://img.shields.io/badge/NASA%20Space%20Apps%202026-0B3D91?style=for-the-badge&logoColor=white)](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/)

[![linkedin](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/elsayed-elmandoh-b5849a1b8/)
