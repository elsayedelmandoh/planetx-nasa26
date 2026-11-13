# src/llm quickstart

**propose:** one provider interface for every model backend.

**input:** messages (role + content), model name, sampling options.

**output:** completion text, token usage, latency, cost.

**structure:**
- `provider.py` -- the interface every backend implements: `complete(messages, ...) -> ChatResponse` and `embed(texts) -> list[vector]`
- `openai_compat.py` -- one implementation for openai, gemini (openai-compatible endpoint) and local servers (vllm, ollama, tgi). same wire format, only base url and model differ
- `mock.py` -- deterministic offline provider, used by tests and by the ci eval gate
- `prompts.py` -- loads prompt files from `prompts/` and fills `{{placeholder}}` slots
- `client.py` -- applies defaults (model, temperature, max tokens), tracks usage and cost, logs every call

**rules:**
- no provider sdk import outside `openai_compat.py`.
- call models through `client.py`, never through a provider directly.
- the interface changes only when every backend changes with it.
