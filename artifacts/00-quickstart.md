# artifacts directory

**propose:** central repository for all pipeline-generated outputs -- processing,
training, and deployment artifacts.

**input:** processed data from `data/` drives training and inference.

**output:** frozen encoders, model weights, and production
deployment assets.

**structure:**
- `preparing/` -- fitted tokenizers, scalers, vectorizers (data-processing outputs)
- `training/` -- checkpoints, model weights, training args (training outputs)
- `exports/` -- onnx, lora adapters, quantized models (deployment assets)

> eval data (predictions, results, figures) lives in **`evals/`**.
> input data (raw, processed, splits) lives in **`data/`**.
