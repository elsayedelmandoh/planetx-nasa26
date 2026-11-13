# tests/integration quickstart

**propose:** test the http api end to end.

**input:** requests built with the test client.

**output:** status codes, response bodies, request ids, auth behaviour.

**structure:**
- `test_api.py` -- one test per endpoint, plus the api key check

**rules:**
- run against the mock provider, same as ci.
- assert on the contract of the response, not on wording.
