# prompts quickstart

**propose:** keep every prompt in version control, next to the code that uses it.

**input:** task descriptions, formatting rules, example dialogues.

**output:** prompt assets the app loads at runtime.

**structure:**
- `system/` -- persona and policy prompts, one file per task
- `templates/` -- reusable templates with `{{placeholder}}` slots
- `few-shot/` -- example input and output pairs

**rules:**
- a prompt change is a product change, it belongs in the commit and in the golden set.
- never build a prompt by string concatenation in code, load it from here.
