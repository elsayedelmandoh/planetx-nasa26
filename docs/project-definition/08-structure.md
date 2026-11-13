# repository structure and file responsibilities

## project structure

```
base-product/
├── src/
│   ├── core/          settings.py, logger.py
│   ├── llm/           provider.py, openai_compat.py, mock.py, prompts.py, client.py
│   ├── rag/           store.py
│   ├── api/           app.py, routes.py
│   ├── evals/         runner.py, metrics.py
│   └── utils/         helpers.py
│
├── tests/
│   ├── unit/
│   ├── contract/
│   └── integration/
│
├── evals/             golden/, benchmarks/, predictions/, results/, figures/
├── prompts/           system/, templates/, few-shot/
├── configs/           default.yaml
├── data/              raw/, processed/, samples/, curated/, instructions/, train/, val/, test/
├── artifacts/         preparing/{tokenizers,vectorizers}/, training/{checkpoints,models}/, exports/
├── notebooks/         01-data-acquisition/ ... 07-model-inference/
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
- configs/: yaml values, model names, thresholds, paths. versioned, no secrets.
- src/core/: loader for `configs/` and `.env` (settings.py, logger.py).
- src/llm/: the one provider interface, its backends, prompt loading, cost tracking.
- src/rag/: chunking and similarity search over the knowledge documents.
- src/api/: fastapi app, routes, request and response models.
- src/evals/: golden set runner, the pass-rate and latency gate, metrics.
- src/utils/: shared helpers that belong to no feature module.
- evals/: eval data. golden/ (fixed split), benchmarks/, predictions/, results/, figures/.
- prompts/: system prompts, templates, few-shot examples, version controlled.
- data/: inputs only. raw/ keeps the source form, processed/ the transformed, samples/ the small fixtures.
- artifacts/: model outputs only. tokenizers, vectorizers, checkpoints, models, exports.
- notebooks/: exploration only. repeatable logic moves into `src/`.
- tests/: unit (one module), contract (every provider), integration (the http api). offline by default.
- docs/project-definition/: the settled definition of the product.
- docs/requirements/: raw thinking before the definition. once settled, it moves up.
- docs/.internal/: agent plans, lessons, skills, sprints, team notes. not product docs.
- .github/workflows/: ci (lint, test, eval gate) and the image push to ecr.

## rules

- one home per concern. data at the root, code in `src/`, same name. never a third place.
- values in `configs/`, loader code in `src/core/`. secrets in `.env`, never committed.
- a folder holds an `00-quickstart.md` that says what goes there. update it with the folder.
- move logic out of notebooks into `src/` as soon as it is used twice.
