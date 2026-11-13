# prompts/few-shot quickstart

**propose:** hold the example dialogues that teach the model the expected shape.

**input:** example inputs and the outputs you want.

**output:** few-shot pairs loaded by `src/llm/prompts.py`.

**structure:**
- one file per task, each example as an input and its expected output

**rules:**
- examples must match the real traffic, not the easy cases.
- keep them short, four examples beat twenty weak ones.
