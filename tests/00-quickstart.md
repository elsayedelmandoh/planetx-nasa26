# tests quickstart

**propose:** prove the product works, offline and fast.

**input:** the app, the provider interface, the golden set.

**output:** a pass/fail suite that runs in ci in under a minute.

**structure:**
- `unit/` -- one file per module, no network, no fixtures beyond tmp dirs
- `contract/` -- rules every provider must satisfy, run against the mock, optionally against the live provider
- `integration/` -- the http api end to end, still against the mock

**rules:**
- no test hits the network. the live contract test is opt-in (`LIVE=1`).
- a bug fix ships with a test that failed before the fix.
