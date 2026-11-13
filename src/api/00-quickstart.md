# src/api quickstart

**propose:** expose the product over http.

**input:** json requests from clients.

**output:** json responses, request ids, access logs.

**structure:**
- `app.py` -- fastapi app, lifespan wiring (provider, client, knowledge store), request-id middleware, error handling
- `routes.py` -- the endpoints and their request and response models

**suggested endpoints:**
- `GET /health` -- is it up, which provider and model
- `POST /v1/chat` -- one completion, returns text plus usage and cost
- `POST /v1/knowledge/documents` -- ingest documents into the store
- `POST /v1/knowledge/query` -- answer from retrieved context, returns citations

**rules:**
- every response carries a request id.
- the api never calls a provider directly, it goes through `src/llm/client.py`.
- optional inbound api key via `INBOUND_API_KEY` in `.env`.
