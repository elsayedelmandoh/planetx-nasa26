# tests/contract quickstart

**propose:** hold every backend to the same rules.

**input:** the provider interface in `src/llm/provider.py`.

**output:** one verdict per provider.

**structure:**
- `test_provider_contract.py` -- the rules: returns text, reports usage, embeds texts, one vector per text

**rules:**
- the contract suite always runs against `src/llm/mock.py`.
- the live provider version is opt-in: `LIVE=1 pytest tests/contract`.
- adding a backend means adding it to this contract, not a new test file.
