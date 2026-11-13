# hazem

## info

- role: devops and coding
- email:
- github:
- linkedin:

## todo

- [ ] set the `HF_SPACE` repo var and the `HF_TOKEN` secret, the deploy job skips until both exist
- [ ] make `make eval` a real check instead of a false green: the runner currently exits 0 without testing anything
- [ ] docker build smoke test for the space image, the deploy reads sdk and port from the readme frontmatter
- [ ] branch protection on `main` so ci must pass before a merge
- [ ] pick up any coding task that lands on the api or the settings layer

## doing

- [X] ci workflow: lint, test, eval gate, every action pinned to a sha
- [X] hugging face space deploy workflow, force-pushes an orphan snapshot so the space keeps no history

## done

- [X] ci workflow on push and pull request
- [X] hugging face deploy workflow, skipped until the space is configured
- [X] `make` targets for install, serve, lint, format, test, eval
