# tests quickstart

**propose:** prove the product works, offline and fast.

**input:** the app, settings, small fits fixtures in `data/samples/`.

**output:** a pass/fail suite that runs in ci in under a minute.

**structure:**
- `unit/` -- one file per module, no network, no fixtures beyond tmp dirs
- `integration/` -- the http api end to end via fastapi `TestClient`

**rules:**
- no test hits the network.
- a bug fix ships with a test that failed before the fix.
