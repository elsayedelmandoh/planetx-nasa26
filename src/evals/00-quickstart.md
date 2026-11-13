# src/evals quickstart

**propose:** check the tool against the 5 benchmark targets and gate ci on it.

**input:** cached cutouts for the benchmark targets (planned).

**output:** a report in `evals/benchmarks/` and a pass or fail exit code.

**structure:**
- `runner.py` -- parses `--gate`. stub for now: prints "no benchmark checks yet" and exits 0

**rules:**
- the gate runs offline so ci stays deterministic and free.
- until the runner has a real assertion, `make eval` is a false green.
- thresholds are settings, not code.
