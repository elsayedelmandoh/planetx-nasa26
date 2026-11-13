# src quickstart

**propose:** hold the application code, one package per concern.

**input:** requests, documents, prompts, settings.

**output:** a running service, eval reports, and logs.

**structure:**
- `core/` -- settings loader (`configs/*.yaml` + `.env`), logging setup
- `llm/` -- provider interface, backends, prompt loading, cost tracking
- `rag/` -- chunking and similarity search
- `api/` -- fastapi app, routes, request and response models
- `evals/` -- eval code: golden set runner, gate, metrics
- `utils/` -- shared helpers

> imports follow the repo convention: `from src.core.settings import *`.
