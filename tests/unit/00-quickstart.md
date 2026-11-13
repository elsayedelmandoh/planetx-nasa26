# tests/unit quickstart

**propose:** test one module at a time.

**input:** a module, plus `tmp_path` for anything that writes.

**output:** fast assertions, no network, no database.

**structure:**
- one test file per module, named after it (`test_settings.py`, `test_coords.py`, ...)

**rules:**
- a unit test never builds the whole app.
- if a test needs a network, it is not a unit test.
