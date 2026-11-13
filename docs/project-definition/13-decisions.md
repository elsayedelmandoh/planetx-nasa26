# decision log

why the project looks the way it does. one line per decision, oldest first.

## template

- 2026-11-13 -- decision -- why -- what it costs us

## entries

- 2026-11-12 -- one provider interface for api and local models -- openai, gemini and every local
  server speak the same wire format, so one implementation covers all three -- switching provider
  means changing base url and model, not code.
- 2026-11-12 -- offline eval gate with a golden set -- a regression must fail in ci, not in
  production -- a golden case per bug, plus the latency and pass-rate thresholds.
- 2026-11-12 -- uv, no lockfile committed -- every project resolves its own tree -- ci resolves
  fresh on each run, so builds are not byte reproducible.
- 2026-11-13 -- oidc for aws deploy -- long lived ecr passwords expire and leak -- the role trust
  policy must be maintained on the aws side.
- 2026-11-13 -- secrets only in `.env`, never committed -- a tracked secret stays in history --
  rotate at the provider the moment a secret lands in a commit.
