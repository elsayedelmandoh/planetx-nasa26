# configs quickstart

**propose:** track training hyperparameters, model architecture configs, and experiment variations as yaml files.

**input:** model name, hyperparameters, learning schedules, dataset references.

**rule:** `configs/*.yaml` holds values; `src/core/` is the loader.

**output:** reproducible experiment configs that can be version-controlled and compared.
