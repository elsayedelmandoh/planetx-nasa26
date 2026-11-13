# research notes and observations

## 0. orchestrator check (2026-11-13, live sia queries)

- `https://irsa.ipac.caltech.edu/SIA?COLLECTION=<c>&POS=CIRCLE+269.452+4.693+0.01&MAXREC=2000` (barnard's star) returns: `spherex_qr2` 0 rows, `spherex_dr1` 240 rows, `spherex_qr3` 123 rows. qr2 is superseded by dr1: use `spherex_dr1` + `spherex_qr3`, not qr2, everywhere below that says qr2.
- barnard's star has 3 survey passes: 2025-08/10 and 2026-03/05 (dr1), 2026-08/09 (qr3), all 6 detectors, roughly 20 visits per detector per pass.
- motion scale: 6.15"/px, so barnard's star (~10.3"/yr) and wise 0855 (~8.1"/yr) shift only ~1.3-1.7 px per year. blink alone barely shows it; difference images and gaia proper-motion arrows are needed to make it visible.
- unverified: judging weights (20% each) come from a news site, not spaceappschallenge.org; the official submission time is still unconfirmed.

## 1. summary: the winning plan in 10 bullets

- pre-cache cutouts for the 5 benchmark targets from irsa s3 `qr2/level2` so the live demo loads instantly (no network wait)
- build a fastapi `/api/cutouts` endpoint that queries the irsa spherex cutout service (simple image access / sia) by ra dec fov and epoch, returns aligned png frames or fits cutouts
- reproject all epochs to a common tangent plane wcs using reproject (reproject_interp for speed, reproject_exact for final frames)
- implement 6 detector band stacking (bands 1-6) on the backend to boost snr; expose as a frontend toggle
- blink player in canvas with play pause frame rate slider epoch scrubber and side by side swipe mode for difference imaging
- on the fly 102 band spectrum: click any pixel, read flux from all 102 bands across the cutout stack, plot with molecular absorption markers (h2o co co2 ch4)
- gaia dr3 and unwise catalog overlays via aladin lite hips layers or custom vector tiles; proper motion vectors for gaia sources
- url query params `?ra=&dec=&fov=&mode=blink|diff|coadd&band=1-6|stack` for embeddability and judge sharing
- contamination flags from fits ext 2 bitmask rendered as overlay toggle (bad pixels cosmic rays saturation)
- honest framing: label detections as "known mover" "variable candidate" "unmatched candidate" never claim planet x discovery

## 2. data access: spherex query + cutout path (exact endpoints, example urls/calls, limits)

### irsa spherex sia v2 endpoint
base url: `https://irsa.ipac.caltech.edu/SIA` https://irsa.ipac.caltech.edu/ibe/sia.html
query parameters for spherex:
- `COLLECTION=spherex_qr2` or `spherex_qr3` or `spherex_dr1` https://irsa.ipac.caltech.edu/ibe/sia.html
- `POS=CIRCLE <ra> <dec> <radius_deg>` https://irsa.ipac.caltech.edu/ibe/sia.html
- `BAND=<min_wavelength_m> <max_wavelength_m>` for 0.75-5.0 µm use `BAND=7.5e-7 5.0e-6` https://irsa.ipac.caltech.edu/ibe/sia.html
- `CALIB=2` for calibrated science-ready data https://irsa.ipac.caltech.edu/ibe/sia.html
- `DPTYPE=image` for spectral images https://irsa.ipac.caltech.edu/ibe/sia.html
- `RESPONSEFORMAT=JSON` or `VOTABLE` https://irsa.ipac.caltech.edu/ibe/sia.html
- `MAXREC=500` recommended to avoid timeout https://irsa.ipac.caltech.edu/ibe/sia.html
- `TIME=<mjd_min> <mjd_max>` for epoch filtering https://irsa.ipac.caltech.edu/ibe/sia.html

example query for barnard's star (ra=269.452, dec=4.693) with 0.1 deg radius:
```
https://irsa.ipac.caltech.edu/SIA?COLLECTION=spherex_qr2&POS=CIRCLE+269.452+4.693+0.1&BAND=7.5e-7+5.0e-6&CALIB=2&DPTYPE=image&RESPONSEFORMAT=JSON&MAXREC=500
```

### cutout service via direct url
append `?center=<ra>,<dec>&size=<deg>` to any level2 fits url https://irsa.ipac.caltech.edu/data/SPHEREx/docs/cutout_tool.html
example:
```
curl -o cutout.fits "https://irsa.ipac.caltech.edu/ibe/data/spherex/qr2/level2/2025W19_2B/l2b-v11-2025-163/3/level2_2025W19_2B_0073_2D3_spx_l2b-v11-2025-163.fits?center=156.09328159,-41.64466331&size=0.1"
```

### python astroquery access
```python
from astroquery.ipac.irsa import Irsa
results = Irsa.query_region(coord, radius=0.1*u.deg, catalog='spherex_qr2')
```
tutorial: https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts/

### s3 direct access (fastest for cutouts)
bucket: `nasa-irsa-spherex` region `us-east-1` https://irsa.ipac.caltech.edu/cloud_access/
prefixes: `qr2/level2/`, `qr3/level2/`, `dr1/level2/` https://irsa.ipac.caltech.edu/cloud_access/
aws cli anonymous: `aws s3 ls --no-sign-request s3://nasa-irsa-spherex/qr2/level2/` https://irsa.ipac.caltech.edu/cloud_access/
supports http range requests for byte-range reads (used by muninn and skyshift) https://github.com/root3315/muninn

### limits and latency
- sia queries: ~5-20 seconds for typical cone search https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts/
- large cone at ecliptic poles: 25000+ frames, 4+ minutes unserved https://github.com/root3315/muninn
- cutout service: 4 MB, 13-21 seconds per frame https://github.com/root3315/muninn
- s3 byte-range: 1-3 MB in few seconds (2.6s per frame on ~240ms connection) https://github.com/Mahadi5577/skyshift
- maxrec default unlimited but jobs >5 min canceled https://irsa.ipac.caltech.edu/ibe/sia.html

## 3. fits structure and flags (what to show, how to mask)

### multi-extension fits layout (qr2/dr1 level2)
from the cutouts tutorial https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts/:
- hdu 0: primary header (minimal metadata, contains `VERSION` keyword)
- hdu 1 (extname `IMAGE`): calibrated spectral image (2040x2040 float32)
- hdu 2 (extname `FLAGS`): per-pixel status and processing flags bitmask
- hdu 3 (extname `VARIANCE`): variance map
- hdu 4 (extname `ZODI`): zodiacal light model
- hdu 5 (extname `PSF`): exposure-averaged point spread function
- hdu 6 (extname `WCS-WAVE`): wavelength world coordinate system

### flags bitmask (ext 2) meaning
from muninn readme https://github.com/root3315/muninn:
- `TRANSIENT` (cosmic-ray jump caught up the ramp)
- `SUR_ERROR` (onboard processing error)
- `NONFUNC` (dead/hot/cold pixels)
- `LOST_DATA` (lost data)
- `PERSIST` (persistence)
- `OUTLIER` (bright source outliers, kept)
- `SOURCE` (real source flag, kept)
- `OVERFLOW` (saturation, kept beside pixels)
dr1 stores flags as rice-compressed tile image https://github.com/root3315/muninn
qr2 used different bit values (e.g. `0x80005` with `OUTLIER`) https://github.com/root3315/muninn

### masking strategy
- blank pixels with `TRANSIENT` | `SUR_ERROR` | `NONFUNC` | `LOST_DATA` | `PERSIST` before resampling https://github.com/root3315/muninn
- keep `OUTLIER` `SOURCE` `OVERFLOW` for real sources
- saturated cores (`OVERFLOW`): report as "saturated" not a magnitude https://github.com/root3315/muninn

### wavelength at pixel
from `WCS-WAVE` extension (hdu 6) using spectral wcs https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts/
each detector has different wavelength mapping due to linear variable filters
detector pairs: D1+D4, D2+D5, D3+D6 observed simultaneously https://irsa.ipac.caltech.edu/Missions/spherex.html

## 4. epochs and time coverage (what blink can realistically show per target)

### data releases timeline
- qr1: jul 2025 - feb 2026 (retired) https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html
- qr2: oct 2025 - present (april 2026 header fix) https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html
- qr3: sep 2026 - present (improved psf/photometry) https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html
- dr1: nov 2026 (reprocessed qr2 + qr3 uniform set) https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_dr1.html

### epochs per sky position (as of nov 2026)
from muninn benchmarks https://github.com/root3315/muninn:
- barnard's star: 17 D2 visits over 397 days (qr2+dr1)
- epsilon indi b: 29 D2 visits over 526 days
- wise 0855: 17 D6 visits over 370 days (only band it's bright in)
- rw aurigae: 16 D2 visits over 372 days
- r draconis: 55 D3 visits over 414 days (index capped at 500 maxrec)
- atala (152): 15 D2 visits over 369 days

### skyshift zoom scales
https://github.com/Mahadi5577/skyshift:
- hours: densest 24h window (asteroid motion ~32"/1.6h for hygiea)
- days: richest survey pass (pluto drift ~3px/day across 201 images sep-oct 2025)
- months: median of up to 5 images per pass
- year: first and last pass

### blink player reality
- typical position: 10-30 visits over ~1 year baseline
- ecliptic poles: 200+ visits but query capped
- 2 epochs (minimal) vs many: most positions have 10+ epochs in qr2+dr1
- time baseline: ~1 year for qr2+dr1 combined, growing with qr3

## 5. frontend: aladin lite vs custom canvas, overlays (gaia, unwise), embedding via url params

### aladin lite v3
embed code https://aladin.cds.unistra.fr/AladinLite/doc/:
```html
<script src="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js"></script>
<div id="aladin-lite-div" style="width: 600px; height: 600px"></div>
<script>
A.init.then(() => {
  aladin = A.aladin('#aladin-lite-div', {
    survey: 'P/DSS2/color', fov: 0.1, target: '133.795 -7.245',
    showReticle: true, showLayersControl: true, showGotoControl: true
  });
});
</script>
```

### available hips surveys for overlays
- gaia dr3: `P/Gaia/DR3/density` or catalog hips `http://alasky.cds.unistra.fr/Gaia/DR3/`
- allwise: `P/allWISE/color` https://aladin.cds.unistra.fr/AladinLite/doc/API/
- unwise: available via cds hips services
- 2mass: `P/2MASS/color`
- custom hips from local fits: `aladin.createImageSurvey()` or `newImageSurvey()` https://aladin.cds.unistra.fr/AladinLite/doc/API/

### catalog overlays (gaia, wise, simbad)
```javascript
// gaia dr3 catalog
let gaia = A.catalogHiPS('http://alasky.cds.unistra.fr/Gaia/DR3/', {
  onClick: 'showTable', color: 'orange', name: 'Gaia DR3',
  filter: src => src.pmra*src.pmra + src.pmdec*src.pmdec > threshold
});
aladin.addCatalog(gaia);

// simbad
let simbad = A.catalogFromSimbad(ra, dec, 0.1);
aladin.addCatalog(simbad);

// skybot for solar system objects
let skybot = A.catalogFromSkyBot(ra, dec, radius, epoch);
aladin.addCatalog(skybot);
```
https://aladin.cds.unistra.fr/AladinLite/doc/API/

### url parameter embedding (aladin lite)
https://cdn.jsdelivr.net/npm/aladin-lite-simon@3.1.3/dist/index.html:
```
?ra=133.795&dec=-7.245&fov=0.1&baseImageLayer=P/DSS2/color
&overlayImageLayer=P/allWISE/color&showReticle=true&projection=TAN
```
aladin methods: `getShareURL()`, `getEmbedCode()` https://aladin.cds.unistra.fr/AladinLite/doc/API/

### custom canvas approach (muninn, skyshift)
- browser reads raw float32 frames from s3 via range requests https://github.com/root3315/muninn
- does stretch (asinh/log/sqrt/linear), blink, wipe, difference client-side https://github.com/root3315/muninn
- reprojection to shared north-up tangent plane done in browser (stamp.js) https://github.com/root3315/muninn
- sector-based change detection matrix (5x4 grid scoring) https://github.com/root3315/muninn
- instant controls (no server round-trip for stretch/blink) https://github.com/Mahadi5577/skyshift

### recommendation for 36h hackathon
- use aladin lite for catalog overlays (gaia, wise, simbad) - zero backend work
- custom canvas for blink player with s3 byte-range fits reads - better control over stretch/difference
- hybrid: aladin lite as base sky view, custom canvas overlay for time-series frames

## 6. processing: reprojection, coadd, difference image, per-detector stacking, spectra on click

### reprojection
reproject package https://reproject.readthedocs.io/en/stable/:
- `reproject_interp(input_data, output_wcs)` - fastest, interpolation-based https://reproject.readthedocs.io/en/stable/
- `reproject_exact(input_data, output_wcs)` - flux-conserving, spherical polygon intersection, slowest https://reproject.readthedocs.io/en/stable/
- `reproject_adaptive` - anti-aliased resampling with optional flux conservation https://reproject.readthedocs.io/en/stable/
- `find_optimal_celestial_wcs([images])` - computes optimal common wcs and shape https://reproject.readthedocs.io/en/stable/
- `reproject_and_coadd([images], output_wcs)` - reproject and coadd in one step https://reproject.readthedocs.io/en/stable/

performance tips https://reproject.readthedocs.io/en/stable/performance.html:
- disable footprint return: `return_footprint=False`
- use memory-mapped output arrays for large images
- multi-threaded reprojection via `parallel` argument
- chunk-by-chunk for memory efficiency

muninn does reprojection in browser bilinear with sip inverse https://github.com/root3315/muninn
skyshift does parallel download + reprojection server-side https://github.com/Mahadi5577/skyshift

### coaddition (stacking)
- simple mean/median: `np.nanmean([arrays], axis=0)` or `np.nanmedian`
- weighted by inverse variance (from ext 3)
- seasonal stack: median of 3, drop brightest of 4+ (removes cosmic rays) https://github.com/root3315/muninn
- shift-and-stack for known motion: align before stacking
- √n depth gain: 10 visits = +1.25 mag, 100 visits = +2.5 mag https://github.com/root3315/muninn

### difference imaging
- `diff = epoch_b - epoch_a` (aligned to same wcs)
- color coding: cyan where A brighter, amber where B brighter https://github.com/root3315/muninn
- diverging color ramp with equal weight arms https://github.com/root3315/muninn
- swipe/wipe mode: draggable divider between two epochs https://github.com/root3315/muninn
- per-visit vs shared stretch: per-visit shows motion, shared shows brightness change https://github.com/root3315/muninn

### per-detector stacking (6 bands)
detector pairs observed simultaneously https://irsa.ipac.caltech.edu/Missions/spherex.html:
- band 1 (0.75-1.1µm, R=39) + band 4 (2.4-3.8µm, R=35)
- band 2 (1.1-1.6µm, R=41) + band 5 (3.8-4.4µm, R=112)
- band 3 (1.6-2.4µm, R=41) + band 6 (4.4-5.0µm, R=128)
stack all visits per detector to boost snr before blink

### on-the-fly 102-band spectrum
- click pixel → read flux from all 102 bands across cutout stack
- wavelength from `WCS-WAVE` at that detector pixel https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts/
- plot flux density vs wavelength (0.75-5.0 µm)
- mark molecular absorption bands: h2o (1.4, 1.9, 2.7µm), co (2.3, 4.7µm), co2 (4.3µm), ch4 (3.3µm) https://github.com/epsretriever/spherex-planet-x
- driftnet pipeline: corrects for distance/phase angle, divides by solar spectrum, compares to bus-demeo asteroid classes https://github.com/epsretriever/spherex-planet-x

## 7. competitor repos: table (repo | approach | stack | strengths | gaps)

| repo | approach | stack | strengths | gaps |
|---|---|---|---|---|
| epsretriever/spherex-planet-x (driftnet) https://github.com/epsretriever/spherex-planet-x | offline pipeline detects movers, links tracks, scores, renders webp; cloudflare worker + next.js frontend | python pipeline (astropy, photutils), cloudflare worker (typescript/hono), next.js static export, three.js 3d | full detection pipeline, orbit fitting, composition analysis, ai write-ups, survey mode, isolated anomaly ranking, vercel+cloudflare deploy | complex multi-service arch, heavy offline compute, no live blink for arbitrary coords |
| shivbhardwaj009/spherex-sky-diary https://github.com/shivbhardwaj009/spherex-sky-diary | static-file architecture: offline pipeline writes candidates.json + cutout pngs; next.js consumes static files | python (detection, matching, spectra), next.js frontend, json schema contract | clean contract enforcement, mock data generator, schema validation, data source toggle | no live irsa queries, static only, limited to pre-computed fields |
| roshcr6/NASA2026 (muninn) https://github.com/roshcr6/NASA2026 | live irsa sia queries, browser reads fits from s3 via range requests, custom canvas blink/wipe/diff | fastapi backend, next.js + three.js frontend, node relay for cors | 3d celestial sphere, live data, evidence dossiers, season stacking, hunter x distance bounds, flag masking, 500 maxrec handling | node relay needed for cors, complex browser fits parser, no aladin integration |
| root3315/muninn https://github.com/root3315/muninn | same as roshcr6/NASA2026 (same team yggdrasil) | node server.js + vanilla js frontend, cloudflare pages fallback | same as above + bilingual (en/ru), sector change matrix, depth panel, csv export, webm recording | same as above |
| mahadi5577/skyshift https://github.com/Mahadi5577/skyshift | time-zoom viewer (hours/days/months/year), hunt planet x game with planted fakes, candidate board | fastapi backend, vanilla js frontend (no build), s3 byte-range reads, skybot known objects | time-zoom concept, hunt game trains users, candidate board, colab support, docker deploy, rate limits | game-focused, less on variable stars, qr2 only at test time |

## 8. judging criteria mapped to features (impact, creativity, validity, relevance, presentation)

official criteria from space apps 2026 https://business-review.eu/tech/it/innovation-feasibility-and-relevance-among-the-criteria-for-evaluating-projects-at-nasa-space-apps-challenge-302778:
1. **impact (20%)** - solves real problem: helps citizen scientists sift >1e9 spherex sources
   - features: blink player for 5 test targets, gaia/wise overlays for identification, spectrum on click, shareable urls
2. **creativity (20%)** - original approach: 6-detector stacking, time-zoom scales, difference imaging with diverging ramp, hunter x distance bounds
   - features: seasonal stack + inter-season blink, sector change matrix, per-visit vs shared stretch toggle
3. **validity (20%)** - scientifically valid: proper wcs reprojection, flag masking, honest labeling, magnitude limits stated
   - features: rice-compressed flag decoding, saturation handling, √n depth extrapolation from measured noise, "no farther than" distance bounds
4. **relevance (20%)** - addresses challenge: coordinate input, time-series blink, 5 benchmark targets, 102-band spectrum
   - features: preset buttons for 5 targets, ra/dec/sexagesimal input, fov selector, url query params
5. **presentation (20%)** - intuitive ui, clear demo, 30s video, public-facing
   - features: single-page app, dark theme with cyan/amber data colors, accessibility contrasts verified, one-sentence pitch on landing

global judging funnel https://crafterwiki.com/plans/nasa-space-apps-2026/:
- phase 1 (local): live pitch + demo → global nominees (~10%)
- phase 2 (dec 2026): nasa/sme review submission only (project page, demo link, repo) → 45 global finalists
- phase 3 (jan 2027): executive committee → 10 global awards
- implication: project page and demo link must stand alone without team present

submission requirements https://www.spaceappschallenge.org/resources/participant-faqs/:
- project page on spaceappschallenge.org (due nov 15)
- 30-second video or slides
- public github repo link
- citation of all sources (nasa reserves right to remove awards for missing citations)

## 9. risks and mitigations (data latency, few epochs, faint targets, demo offline cache)

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| irsa sia slow/down during hackathon | high | demo fails | pre-cache all 5 benchmark targets + 3-5 extra showcase fields as static png/webp + fits cutouts |
| s3 byte-range cors blocked | medium | browser can't read fits | cloudflare worker relay (like muninn/skyshift) or cloudflare quick tunnel for demo |
| few epochs for some positions (<3) | medium | blink boring | use skyshift time-zoom: hours/days/months/year frames from available data; seasonal stack |
| target too faint (wise 0855 at 17.2 ab in d6) | high | invisible in single frame | detector stacking (6 bands), seasonal coadd (√n), shared stretch mode |
| qr2/dr1 query returns 0 frames | low | empty demo | verify all 5 targets have frames in qr2+dr1 before hackathon; fallback to mock data badge |
| reprojection errors (large fov distortion) | low | misaligned blink | use `find_optimal_celestial_wcs`, limit fov to 30' max, tan projection |
| 36h not enough for full pipeline | high | incomplete demo | prioritize: 1) preset blink 2) difference imaging 3) gaia overlay 4) spectrum 5) hunt game |
| judge can't run demo locally | medium | poor evaluation | deploy to vercel/cloudflare pages + cloudflare tunnel backup; share url with `?ra=&dec=` |
| missing citations → award removal | low | disqualification | cite all: irsa dois (10.26131/IRSA652 qr2, 10.26131/IRSA678 dr1), spherex papers, aladin, astropy, reproject |

## 10. open questions for the team

1. which frontend approach: pure aladin lite (fastest to build) vs custom canvas (more control) vs hybrid?
2. backend language: fastapi/python (matches existing repo) vs node (muninn approach) vs cloudflare worker (driftnet)?
3. deploy target: vercel + cloudflare worker (driftnet) vs cloudflare pages (muninn) vs single docker container?
4. use existing `src/api/routes.py` fastapi shell or rewrite for cutout endpoint?
5. pre-cache strategy: download all 5 targets' qr2+dr1 frames now? how many frames per target?
6. spectrum feature: full 102-band from cutout stack or 6-band from detector stacks?
7. hunt game (skyshift style) worth the time or focus on blink/diff/spectrum?
8. bilingual (en/ar) for giza local event? muninn did en/ru.
9. how to handle qr3 frames - separate collection or merged with dr1?
10. team role split: backend (2), frontend (2), data/science (1), devops/demo (1)?

## sources (numbered list of every url cited)

1. https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/ - official challenge page
2. https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources - challenge resources tab
3. https://caltech-ipac.github.io/spherex-archive-documentation/ - spherex archive user guide
4. https://irsa.ipac.caltech.edu/Missions/spherex.html - irsa spherex mission hub
5. https://irsa.ipac.caltech.edu/data/SPHEREx/docs/cutout_tool.html - spherex cutout service docs
6. https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html - quick release overview
7. https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_dr1.html - data release 1 overview
8. https://irsa.ipac.caltech.edu/cloud_access/ - irsa cloud data access guide
9. https://irsa.ipac.caltech.edu/ibe/sia.html - simple image access v2 queries
10. https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts/ - spherex cutouts tutorial notebook
11. https://reproject.readthedocs.io/en/stable/ - reproject documentation
12. https://aladin.cds.unistra.fr/AladinLite/doc/ - aladin lite v3 documentation
13. https://aladin.cds.unistra.fr/AladinLite/doc/API/ - aladin lite v3 api reference
14. https://cdn.jsdelivr.net/npm/aladin-lite-simon@3.1.3/dist/index.html - aladin lite url parameter handling example
15. https://github.com/epsretriever/spherex-planet-x - driftnet repo
16. https://github.com/shivbhardwaj009/spherex-sky-diary - spherex sky diary repo
17. https://github.com/roshcr6/NASA2026 - muninn repo (team yggdrasil)
18. https://github.com/root3315/muninn - muninn repo (same team, more detailed readme)
19. https://github.com/Mahadi5577/skyshift - skyshift repo
20. https://business-review.eu/tech/it/innovation-feasibility-and-relevance-among-the-criteria-for-evaluating-projects-at-nasa-space-apps-challenge-302778 - judging criteria article
21. https://www.spaceappschallenge.org/resources/participant-faqs/ - participant faqs
22. https://crafterwiki.com/plans/nasa-space-apps-2026/ - judging funnel and rubric analysis
23. https://www.ipac.caltech.edu/doi/irsa/10.26131/IRSA652 - qr2 doi
24. https://www.ipac.caltech.edu/doi/irsa/10.26131/IRSA678 - dr1 doi
25. https://doi.org/10.26131/IRSA652 - qr2 doi (alt)
26. https://doi.org/10.26131/IRSA678 - dr1 doi (alt)
27. https://doi.org/10.26131/IRSA662 - qr3 doi
28. https://doi.org/10.26131/IRSA679 - dr1 all-sky cube doi
29. https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge/ - nasa announcement
30. https://irsa.ipac.caltech.edu/data/SPHEREx/docs/SPHEREx_Expsupp.pdf - spherex explanatory supplement (pdf, not fetched directly)
31. https://astroquery.readthedocs.io/en/latest/ipac/irsa/irsa.html - astroquery irsa module docs
32. https://registry.opendata.aws/spherex-qr/ - aws open data registry spherex qr
33. https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/index.html - s3 browsable bucket index
34. https://aladin.cds.unistra.fr/AladinLite/ - aladin lite demo page
35. https://cds-astro.github.io/aladin-lite/ - aladin lite api docs (alt)
36. https://github.com/Caltech-IPAC/spherex-archive-documentation - spherex archive docs github
37. https://github.com/Caltech-IPAC/irsa-tutorials - irsa tutorials github
38. https://irsa.ipac.caltech.edu/onlinehelp/spherex/#sp - spherex spectrophotometry tool docs
39. https://irsa.ipac.caltech.edu/applications/spherex - spherex data explorer
40. https://irsa.ipac.caltech.edu/applications/MOST - moving object search tool
41. https://ssd.jpl.nasa.gov/tools/sbident.html - jpl small-body identification
42. https://ssd.jpl.nasa.gov/horizons/ - jpl horizons
43. https://gea.esac.esa.int/archive/ - esa gaia archive
44. https://irsa.ipac.caltech.edu/Missions/wise.html - wise/neowise at irsa
45. https://simbad.cds.unistra.fr/simbad/ - cds simbad
46. https://vizier.cds.unistra.fr/ - cds vizier
47. https://imcce.fr/ - imcce skybot
48. https://www.astropy.org/ - astropy
49. https://photutils.readthedocs.io/ - photutils
50. https://www.backyardworlds.org/ - backyard worlds planet 9 (inspiration)
51. https://doi.org/10.5281/zenodo.23193726 - skyshift zenodo citation
52. https://muninn.mydevbox.xyz - muninn live demo
53. https://driftnet-sky.vercel.app - driftnet live demo
54. https://mahadi5577.github.io/skyshift/ - skyshift live demo
55. https://hackathlone.com/blogs/how-judging-works - judging process blog
56. https://mindshipglobal.com/opportunities/nasa-space-apps-challenge-2026/ - judging criteria summary