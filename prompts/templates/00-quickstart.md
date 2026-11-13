# prompts/templates quickstart

**propose:** hold reusable prompt templates with fillable slots.

**input:** the template text.

**output:** a rendered prompt, slots filled by `src/llm/prompts.py`.

**structure:**
- `<template-name>.md` -- template files, slots written as `{{placeholder}}`

**rules:**
- slots use `{{name}}`, not `{}`. json examples inside a prompt stay valid.
- keep the template readable, it is reviewed by humans.
