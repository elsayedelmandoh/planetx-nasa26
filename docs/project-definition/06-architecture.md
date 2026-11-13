# system architecture and component boundaries

describe the major components, their inputs and outputs, where state lives, and what can fail.

## template

- entrypoint: app.py
- configuration: configs/ (values), src/core (loader)
- storage: data/
- business logic: src/
- evaluation: evals/ (data), src/evals/ (code), notebooks/ and tests/
- documentation: docs/
