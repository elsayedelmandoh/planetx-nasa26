# data directory

**propose:** central store for input data only -- downloaded fits and cached cutouts.

**input:** spherex fits from irsa / s3, small fixtures.

**output:** cached, aligned cutouts the web tool serves.

**pipeline map:**
- `raw/` -> `processed/` (downloaded fits -> reprojected cutouts per epoch)
- `samples/` -> tiny fits fixtures for offline tests
