# http api contract

the contract between the service and its callers. one entry per endpoint.

## template

- `GET /health` -- is it up, which provider and model
  - request: none
  - response: `{"status": "ok", "provider": "...", "model": "..."}`
  - errors: none

## rules

- one entry per endpoint: method, path, request shape, response shape, failure modes.
- the contract changes with the code, in the same commit.
- no endpoint without a documented failure mode.
- auth, if any, is stated per endpoint.
