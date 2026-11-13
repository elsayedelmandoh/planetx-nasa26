# decision log

why the project looks the way it does. one line per decision, oldest first.

## template

- 2026-11-13 -- decision -- why -- what it costs us

## entries

- 2026-11-12 -- (superseded 2026-11-13, llm code dropped) one provider interface for api and local models -- openai, gemini and every local
  server speak the same wire format, so one implementation covers all three -- switching provider
  means changing base url and model, not code.
- 2026-11-12 -- offline eval gate with a golden set -- a regression must fail in ci, not in
  production -- a golden case per bug, plus the latency and pass-rate thresholds.
- 2026-11-12 -- uv, no lockfile committed -- every project resolves its own tree -- ci resolves
  fresh on each run, so builds are not byte reproducible.
- 2026-11-13 -- oidc for aws deploy -- superseded the same day by the hugging face deploy below.
- 2026-11-13 -- deploy to a hugging face docker space -- free public hosting fits a hackathon demo --
  ci force-pushes an orphan snapshot, so the space keeps no history; needs `HF_SPACE` var + `HF_TOKEN`
  secret.
- 2026-11-13 -- secrets only in `.env`, never committed -- a tracked secret stays in history --
  rotate at the provider the moment a secret lands in a commit.
- 2026-11-13 -- dropped llm/ml boilerplate (llm, rag, model and inference code, prompt files,
  training data splits and training notebooks); brief is a web image tool -- no requirement in the brief
  needs a model or a provider -- the eval gate is a stub until benchmark checks exist.
