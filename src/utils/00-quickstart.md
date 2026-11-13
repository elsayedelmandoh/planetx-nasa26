# src/utils quickstart

**propose:** shared helpers used across the app.

**input:** plain values from callers.

**output:** plain values back.

**structure:**
- `helpers.py` -- small pure functions, no business logic

**rules:**
- no helper reaches into another package. if it needs the provider or the store, it belongs in that package.
- delete a helper when only one caller uses it.
