# training

**propose:** store outputs from the training pipeline -- checkpoints, weights, and metadata.

**subdirs:**
- `checkpoints/` -- optimizer states, weights, step metadata (for resume/rollback)
- `models/` -- final merged or exported model weights

**input:** processed data + prepared transforms from `data/` and `artifacts/preparing/`.

**output:** frozen model artifacts passed to evaluation and deployment.
