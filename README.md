# base-product

boilerplate for llm apps (agent / rag) that ship as a running product.

one repo per project: copy this folder, rename, set `.env`, implement, deploy.

## start a new project

1. copy this folder into a new repo, set `PROJECT_NAME` in `.env`.
2. `cp .env.example .env`, pick `PROVIDER` (`openai`, `gemini`, `local`, `mock`), add the matching key.
3. `uv sync --all-extras`
4. implement in this order: `src/llm/provider.py` -> `src/llm/openai_compat.py` -> `src/api/routes.py` -> `src/evals/runner.py`.
5. write expected answers in `evals/golden/golden.jsonl`.
6. `make test` then `make eval` (the eval gate) then `make serve`.

## what goes where

| path | holds |
|---|---|
| `src/llm/` | the one provider interface, its backends, prompt loading, cost tracking |
| `src/rag/` | chunking and similarity search over your documents |
| `src/api/` | fastapi app, routes, request and response models |
| `src/core/` | settings loader (`configs/*.yaml` + `.env`), logging |
| `src/evals/` | eval code: golden set runner, pass-rate / latency gate, metrics |
| `src/utils/` | shared helpers |
| `prompts/` | system prompts, templates, few-shot examples, version controlled |
| `data/` | raw and processed documents that feed the knowledge store |
| `evals/golden/` | the fixed split: prompt plus expected answer, one case per line |
| `evals/results/` | eval reports, gitignored |
| `tests/` | unit, contract, integration. offline by default |
| `docs/project-definition/` | problem, goal, api contract, decision log |
| `docs/.internal/` | agent plans and notes, not product docs |
| `.github/workflows/` | ci (lint, test, eval gate) and image push |

## where things go

- `data/` inputs
- `configs/` values (hyperparams, model names, thresholds), versioned
- `src/core/` loader for configs and `.env`
- `src/` code
- `evals/` eval data and results (golden, predictions, results, figures, benchmarks)
- `artifacts/` model outputs (preparing, training, exports)
- `logs/` runtime logs

every folder holds an `00-quickstart.md` with the same details for that folder.

## rules

- one provider interface, in `src/llm/provider.py`: `complete(...)` and `embed(...)`. api and local backends differ only by base url and model name.
- no network in tests. everything offline goes through `src/llm/mock.py`.
- the golden set is the quality contract. add a case per bug you fix.
- `.env` stays out of git. keys live in env vars, never in code.
- no new dependency without a reason.

## legacy folders

ml leftovers from the old template, safe to delete when you start a project:
`src/models/`, `src/inference/`, `src/utils/data_*.py`,
`notebooks/05-model-training/` .. `notebooks/07-model-inference/`,
`evals/01-evaluation.md` .. `evals/04-results-analysis.md`, `docs/deliverables/`.
