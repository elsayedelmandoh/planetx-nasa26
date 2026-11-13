# prompts/system quickstart

**propose:** hold the system prompts that set the model behaviour.

**input:** the behaviour you want, in plain words.

**output:** one markdown file per task, loaded by `src/llm/prompts.py`.

**structure:**
- `<task-name>.md` -- the system prompt for that task, for example `rag-assistant.md`

**rules:**
- one task per file.
- state the rules the model must follow, including what to do when it does not know.
- changing a file here changes product behaviour, update the golden set in the same commit.
