# project definition quickstart

use this section to define the project before writing code. keep each file focused on one decision area so the repo stays easy to scan and update.

## suggested order

01. problem: what pain exists and who feels it.
02. goal: what success looks like.
03. dataset: where the data comes from and what shape it has.
04. solution: what you will build.
05. constraints: what the system must respect.
06. architecture: how the pieces fit together.
07. stack: what tools you will use and why.
08. structure: what each folder and file is for.
09. workflow: how work moves from idea to delivery.
10. references: references.
11. future-work: what is out of scope now.
12. api: the http contract, one entry per endpoint.
13. decisions: why the big calls were made, and what they cost.

## rules

- one decision area per file, never two homes for the same fact.
- raw thinking lives in `docs/requirements/`, settled definition lives here.
- a decision that is not written down gets re-litigated. write it in `13-decisions.md`.
