# decision log

why the project looks the way it does. one line per decision, oldest first.

## template

- 2026-11-13 -- decision -- why -- what it costs us

## entries

- 2026-11-12 -- offline eval gate -- a regression must fail in ci, not in production -- a check per
  benchmark target, run offline against the five targets.
- 2026-11-12 -- uv, lockfile not committed -- ci resolves fresh on each run -- builds are not byte
  reproducible.
- 2026-11-13 -- dropped the llm/ml boilerplate (provider interface, rag, model and inference code,
  prompt files, training data splits and training notebooks); brief is a web image tool -- no
  requirement in the brief needs a model or a provider -- the eval gate is a stub until benchmark
  checks exist.
- 2026-11-13 -- deploy to a hugging face docker space -- free public hosting fits a hackathon demo --
  ci force-pushes an orphan snapshot, so the space keeps no history; needs `HF_SPACE` var + `HF_TOKEN`
  secret.
- 2026-11-13 -- secrets only in `.env`, never committed -- a tracked secret stays in history --
  rotate at the provider the moment a secret lands in a commit.
- 2026-11-13 -- grilling and design decisions live in this file; no CONTEXT.md, no docs/adr/ --
  user wants no new doc files -- the glossary has no home yet.
- 2026-11-13 -- moving-object detection is rule-based: difference image, threshold, gaia dr3 cross-match;
  a real-vs-artifact classifier is a stretch goal only -- explainable to judges, no labels needed, fits
  36h -- no learned model in the core demo.
- 2026-11-13 -- evaluation labels come from injecting synthetic moving sources into real cutouts plus
  gaia dr3 high-proper-motion stars as known positives -- the irsa image table has no labels --
  injected sources only approximate real psf and noise.
- 2026-11-13 -- data/raw/table_Spectral-Images.csv is an example irsa query result, not a training
  set: 225 level 2 exposures near ra 266.8, dec -28.5 (galactic center), detectors d1-d6, 3 epochs
  (2025-08/09 spherex_dr1, 2026-03 spherex_dr1, 2026-08/09 spherex_qr3) -- it proves the blink
  player gets at least 3 epochs -- pixels still need per-target queries and datalink fits downloads.
- 2026-11-13 -- detector runs offline in the pipeline; results are cached as overlay json for the 5
  benchmark targets -- hugging face cpu is slow and the demo must be instant -- arbitrary coordinates
  get no detector overlay live.
- 2026-11-13 -- salma owns the detector, timeboxed to 6 hours, off the critical path -- the blink
  tool must demo without it -- detector may ship partial or not at all.
- 2026-11-13 -- detector output shows as markers labelled "unmatched moving candidate" or "known
  high-proper-motion object" with a score -- honesty notes in the brief forbid discovery claims -- no
  candidate is called a discovery.
- 2026-11-13 -- detector success = it shows the motion of wise 0855 and barnard's star across epochs,
  plus recall on injected movers and false candidates per field -- measurable and demo-friendly --
  needs an injection script.
- 2026-11-13 -- detector footprint is one module src/utils/detect.py plus one notebook in
  notebooks/03-data-processing/; no model or training folders return unless a trained model is chosen
  later -- keeps the restructured tree -- a trained model would need a new decision.
- 2026-11-13 -- tickets live only as github issues; each member file in
  docs/.internal/team/ lists links to that member's issues -- one copy cannot drift -- the member files
  are an index, not the source.
- 2026-11-13 -- github user joamir10 is youssef (web frontend) -- issues can be assigned to
  him now -- other members get unassigned issues until they join.
- 2026-11-13 -- frontend = our own canvas blink player as the main view; aladin lite is a stretch
  side panel with gaia and unwise layers -- the blink player is the required feature -- two viewers
  to keep in sync if aladin lands.
- 2026-11-13 -- must-have scope: ra/dec input, 5 preset buttons, ?ra=&dec=&fov= url params,
  3-epoch blink per detector stack, difference image a-b, irsa credit. stretch in priority order: ext
  2 flag overlay, aladin lite + gaia overlay, the detector, spectrum on click -- judges check
  relevance first -- stretch items may not ship.
- 2026-11-13 -- queries: the 5 benchmark targets are precomputed and cached; any other ra/dec runs
  a live best-effort query with a loading state -- the demo never waits on irsa -- live queries can
  be slow or fail.
- 2026-11-13 -- frames reach the browser as png per epoch and detector, stretched server-side with
  astropy zscale, plus json metadata -- small transfers, no fits library in js -- pixel values are not
  available in the browser.
- 2026-11-13 -- mohsen (graphics) owns the 30-second video, slides, logo and ui visual polish --
  presentation is a judging criterion -- depends on a working ui early.
- 2026-11-13 -- mostafa (research) owns scientific validity: expected positions from proper motion
  times the epoch gap for the 5 targets, checking frames show the shift, honesty wording, "how it works"
  text for the project page -- validity is a judging criterion -- needs frames before he can check.
- 2026-11-13 -- internal deadlines: code freeze nov 15 12:00 cairo, video and project page by 15:00,
  then submit -- the official submission time is not yet confirmed -- leaves 3 hours of buffer at most.
- 2026-11-13 -- ui language is english only -- global judging and the brief are english -- no arabic ui
  for local judges.
- 2026-11-13 -- data releases are spherex_dr1 + spherex_qr3; qr2 is dropped -- a live irsa sia
  query returns 0 qr2 rows (superseded by dr1) -- release names live in configs/default.yaml, so a
  new release is a one-line change.
- 2026-11-13 -- one blink frame = one coadd per survey pass (3 frames per target, about 20 visits
  stacked each); per-visit frames are a stretch toggle -- coadds raise snr and show year-scale
  motion -- hour-scale asteroid motion only with the toggle.
- 2026-11-13 -- motion is ~1.3-1.7 px per year at 6.15"/px, so the ui upsamples cutouts 4x for
  display, shows the a-b difference image (mover appears as a dipole) and a gaia proper-motion
  arrow; mostafa checks the expected shift -- plain blink barely shows the benchmark movers --
  upsampling adds no information, only visibility.
- 2026-11-13 -- precomputed frames (png + json) are committed under data/processed/<target>/ and
  copied into the docker image -- a few mb, demo works offline -- needs data/processed/* not
  gitignored and one dockerfile copy line.
- 2026-11-13 -- spectrum on click is a stretch built from per-visit frames and their ext 6
  wavelength wcs; last in stretch priority -- each pixel sees a different wavelength across visits
  -- may not ship.
- 2026-11-13 -- no planet-hunt game -- not in the brief, costs must-have time -- loses a
  gamification angle some competitors have.
- 2026-11-13 -- submission deadline: the internal nov 15 15:00 cairo deadline stands until the
  official space apps / giza time is confirmed -- research could not fetch the official page --
  must re-check before the event.
- 2026-11-13 -- backend stays the existing fastapi app; /api/cutouts is added in src/api/routes.py
  and the server fetches from irsa -- no node relay or cloudflare worker, no browser cors problem --
  the server does all irsa traffic.
- 2026-11-13 -- supersedes the data/processed/<target>/ entry: precomputed frames (png + json) are
  committed under web/cache/<target>/ -- data/processed/ stays gitignored, while web/ is already copied
  into the docker image and served at / by the static mount, so no new route or dockerfile line is
  needed -- web/ mixes code and generated assets.
