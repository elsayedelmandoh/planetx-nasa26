# evals/golden quickstart

**propose:** keep the fixed split of expected answers in one file.

**input:** hand written cases, one json object per line.

**output:** the cases the runner scores against.

**structure:**
- `golden.jsonl` -- fields: `id`, `prompt`, `expected`, optional `match` (`contains`, `exact`, `json`), optional `tags`

**rules:**
- one behaviour per case, a failing case must point at one thing.
- keep prompts realistic, they are the closest thing to what users send.
- a case for every bug you fix.
