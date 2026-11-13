# youssef

## info

- role: web frontend
- email:
- github:
- linkedin:

## todo

- [ ] blink player: play the epoch stack from `GET /api/cutouts` as a loop on the canvas
- [ ] wire the preset buttons to `GET /api/targets` and fill the ra/dec form from the selection
- [ ] url state: read and write `?ra=...&dec=...&fov=...` so a view is shareable and embeddable
- [ ] error and empty states: bad coordinate, no epoch for that field, fov outside the release
- [ ] responsive pass so the tool works on a phone during judging

## doing

- [X] frontend shell in `web/index.html`: ra/dec form, fov select, canvas, presets container

## done

- [X] frontend shell merged
- [X] fov presets wired to the values in `configs/default.yaml`
