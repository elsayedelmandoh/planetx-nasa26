# stack overview and tooling choices

## focus

- astronomy data: fits, wcs, sky coordinates
- public web tool: fastapi service plus a static frontend
- offline eval gate over the five benchmark targets

## core stack
- language: python 3.12
- environment: uv, conda fallback
- entrypoint: app.py
- reusable code: src/
- tests: tests/
- notebooks: notebooks/
- docs: docs/
- frontend: web/ (static html served by fastapi)
- data layout: data/raw (downloads), data/processed (cached cutouts), data/samples
- ide: vscode (wsl2)
- architect: claude 4.6 opus
- implementation: glm5, kimi k2.5, qwen 3.6 pro
- code review: claude 4.6 opus
- deployment: hugging face, docker

## libraries
- runtime: numpy, pyyaml, pydantic, pydantic-settings
- service: fastapi, uvicorn
- astro: astropy, astroquery, reproject
- dev: pytest, httpx, ruff

## project rules
- keep dependencies minimal until a feature needs them
- add a library only when it supports a concrete use case
- keep notebooks for exploration and move stable logic into src/
- keep tests deterministic and repeatable
