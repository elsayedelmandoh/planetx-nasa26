# decision log

why the project looks the way it does. one line per decision, oldest first.

## template

- 2026-11-13 -- decision -- why -- what it costs us

## entries

- 2026-11-12 -- offline eval gate -- a regression must fail in ci, not in production -- a check per
  benchmark target, run offline against the five targets.
- 2026-11-12 -- uv, lockfile not committed -- ci resolves fresh on each run -- builds are not byte
  reproducible.
- 2026-11-13 -- dropped the llm/ml boilerplate (provider interface, rag, model and inference code,
  prompt files, training data splits and training notebooks); brief is a web image tool -- no
  requirement in the brief needs a model or a provider -- the eval gate is a stub until benchmark
  checks exist.
- 2026-11-13 -- deploy to a hugging face docker space -- free public hosting fits a hackathon demo --
  ci force-pushes an orphan snapshot, so the space keeps no history; needs `HF_SPACE` var + `HF_TOKEN`
  secret.
- 2026-11-13 -- secrets only in `.env`, never committed -- a tracked secret stays in history --
  rotate at the provider the moment a secret lands in a commit.
