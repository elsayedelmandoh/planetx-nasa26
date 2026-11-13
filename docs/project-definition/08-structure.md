# repository structure and file responsibilities

## project structure

```
planetx-nasa26/
├── src/
│   ├── core/          settings.py, logger.py
│   ├── api/           app.py, routes.py
│   ├── evals/         runner.py
│   └── utils/         helpers.py, data_acquisition.py, data_processing.py
│
├── web/               index.html
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── evals/             benchmarks/, figures/
├── configs/           default.yaml
├── data/              raw/, processed/, samples/
├── notebooks/         01-data-acquisition/, 02-eda/, 03-data-processing/
│
├── docs/
│   ├── project-definition/
│   │   ├── 00-quickstart.md           # section overview
│   │   ├── 01-problem.md              # problem statement & context
│   │   ├── 02-goal.md                 # project goals & objectives
│   │   ├── 03-dataset.md              # data sources & specifications
│   │   ├── 04-solution.md             # proposed solution approach
│   │   ├── 05-constraints.md          # should do / should not do
│   │   ├── 06-architecture.md         # system design & data flow
│   │   ├── 07-stack.md                # technology stack & dependencies
│   │   ├── 08-structure.md            # this file
│   │   ├── 09-workflow.md             # development workflow & process
│   │   ├── 10-references.md           # references & papers
│   │   ├── 11-future-work.md          # out of scope for now
│   │   ├── 12-api.md                  # http contract, one entry per endpoint
│   │   └── 13-decisions.md            # why the big calls were made
│   │
│   ├── requirements/
│   │   ├── 00-quickstart.md           # section overview
│   │   ├── 01-quick-info.md           # the ask, in one page
│   │   ├── 02-related-work.md         # competitor landscape, prior art
│   │   ├── 03-research-notes.md       # raw observations, exploration logs
│   │   ├── 04-self-learning.md        # skill gaps, learning goals
│   │   └── 05-timeline.md             # milestones & schedule
│   │
│   ├── deliverables/                  # proposal, presentation, paper
│   └── .internal/                     # agent-workflow/, sprints/, team/, archive/
│
├── .github/workflows/  ci.yml, deploy.yml
├── .env  .env.example
├── AGENTS.md  README.md  LICENSE
├── app.py  Makefile  Dockerfile  pyproject.toml
```

## directory explanation

- app.py: entrypoint for local startup and quick validation.
- configs/: yaml values: data release, fov presets, benchmark targets, paths. versioned, no secrets.
- src/core/: loader for `configs/` and `.env` (settings.py, logger.py).
- src/api/: fastapi app, routes. serves web/ at /.
- src/evals/: offline eval gate runner (stub until benchmark checks exist).
- src/utils/: coordinate parsing, data acquisition and processing helpers.
- web/: the static frontend (ra/dec input, fov, presets, blink player).
- evals/: eval data. benchmarks/, figures/.
- data/: inputs only. raw/ keeps downloaded fits (not shipped), processed/ the cached cutouts, samples/ the small fixtures.
- notebooks/: exploration only. repeatable logic moves into `src/`.
- tests/: unit (one module), contract (api shapes), integration (the http api). offline by default.
- docs/project-definition/: the settled definition of the product.
- docs/requirements/: raw thinking before the definition. once settled, it moves up.
- docs/.internal/: agent plans, lessons, skills, sprints, team notes. not product docs.
- .github/workflows/: ci (lint, test, eval gate) and the push to a hugging face docker space.

## rules

- one home per concern. data at the root, code in `src/`, same name. never a third place.
- values in `configs/`, loader code in `src/core/`. secrets in `.env`, never committed.
- a folder holds an `00-quickstart.md` that says what goes there. update it with the folder.
- move logic out of notebooks into `src/` as soon as it is used twice.
