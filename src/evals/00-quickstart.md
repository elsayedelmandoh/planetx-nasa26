# src/evals quickstart

**propose:** score the product against the golden set and gate on it.

**input:** `evals/golden/golden.jsonl`, a provider from `src/llm/`.

**output:** a report in `evals/results/` and a pass or fail exit code.

**structure:**
- `runner.py` -- load the golden set, run every case, compare, summarize (pass rate, p50/p95 latency, tokens, cost), write the report, exit 1 when a threshold is missed
- `metrics.py` -- alignment and loss metric stubs (ml leftover)

**rules:**
- the ci gate runs against the mock provider so it is deterministic and free. a scheduled job runs it against the real provider.
- thresholds are settings, not code. set them in `.env` once you know your bar.
- one golden case per bug you fix.
