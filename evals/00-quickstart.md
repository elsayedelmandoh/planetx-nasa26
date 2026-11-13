# evals quickstart

**propose:** hold the tool to the 5 benchmark targets from the brief.

**input:** cached cutouts for the targets, run by `src/evals/runner.py`.

**output:** a report in `results/`, and a gate result for ci.

**structure:**
- `figures/` -- blink frames and difference images from the reports, committed
- `benchmarks/` -- benchmark target notes and expected behaviour

**rules:**
- a benchmark check is a promise about behaviour. changing an expected result needs a reason in the commit.
- add a check for every bug the tool had.
