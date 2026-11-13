# evals quickstart

**propose:** hold the product to a fixed set of expected answers.

**input:** `golden/golden.jsonl` plus a provider from `src/llm/`.

**output:** a report in `results/`, and a gate result for ci.

**structure:**
- `golden/` -- the fixed split, one case per line: id, prompt, expected answer, match rule
- `results/` -- eval reports, gitignored
- `figures/` -- charts from the reports, committed
- `benchmarks/` -- benchmark configs and notes
- `predictions/` -- model outputs from inference runs

**rules:**
- a golden case is a promise about behaviour. changing an expected answer needs a reason in the commit.
- add a case for every bug the product had.
- match rules: `contains` (default), `exact`, `json`.
