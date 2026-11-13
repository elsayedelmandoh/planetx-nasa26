# src/rag quickstart

**propose:** turn documents into chunks the product can retrieve.

**input:** raw documents from `data/raw/`, an embedder from `src/llm/`.

**output:** top-k chunks with similarity scores, returned to the model as context.

**structure:**
- `store.py` -- chunking, embedding, cosine search, keep the source id with every chunk

**rules:**
- keep the store behind this one module. swapping it for pgvector or chroma must not touch the api.
- always keep the source of a chunk, an answer without a source is not auditable.
