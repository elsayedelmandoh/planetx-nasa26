# presentation: planetx-nasa26 (nasa space apps 2026, planet x and spherex)

for mohsen (video, slides) and mostafa (scientific text). verified against the repo on 2026-11-14. anything unverifiable is marked `<recall from ml_metrics.json>` or "pending".

---

## project page (space apps form)

**project name:** planetx-nasa26 - spherex sky blink

**one-sentence summary (25 words max):**
a public web tool that blinks spherex sky images across survey passes so anyone can spot moving and variable objects in seconds.

(word count: 24)

**description (~150 words):**
nasa's spherex mission maps the whole sky every six months in 102 near-infrared bands and will image more than a billion objects. comets, asteroids, brown dwarfs, and variable stars reveal themselves by shifting position or brightness between epochs, but no person can sift that volume alone. planetx-nasa26 turns spherex data into a blink player in the browser: pick a patch of sky (or click a benchmark target), watch coadded survey passes blink, and see a mover as a dipole in the difference image. frames are precomputed per survey pass and per detector from spherex dr1 and qr3, aligned to a common wcs, and stretched for display. a rule-based detector flags moving candidates (5-sigma, dipole pairing, gaia dr3 proper-motion match); an ml score ranks them. planet x is the motivation, not a discovery. no new object is claimed.

**how it works (5 steps, real pipeline):**
1. input: ra/dec (decimal or sexagesimal) or one of the 5 preset benchmark targets; field of view 2/5/15/30 arcmin; url params `?ra=&dec=&fov=` for sharing.
2. cutout: calibrated level 2 spherex spectral images (dr1 + qr3) are pulled from irsa (sia / s3), masked with the ext 2 flags hdu (transients, persistence, dead pixels zeroed; source, outlier, overflow kept).
3. align and stack: each visit is reprojected onto a common tangent-plane wcs (reproject_interp, native 6.15"/px), then nanmedian-coadded per survey pass (about 20 visits per pass, gap threshold 60 days).
4. render: zscale stretch, 4x upsample for display (visibility only, no added information), png + json metadata under web/cache/<target>/<detector>/. coadds plus symmetric-stretch difference images (pass n - pass n-1).
5. detect and score: rule-based dipole detection on difference images (5-sigma threshold, dipole pairing, proper-motion match against gaia dr3); markers labelled "known high-proper-motion object" or "unmatched moving candidate" with an ml score from a gradient-boosted classifier trained on synthetic movers injected into real spherex difference images.

**tools and data used (with citations):**
- spherex dr1: doi 10.26131/IRSA678 (https://doi.org/10.26131/IRSA678)
- spherex qr3: doi 10.26131/IRSA662 (https://doi.org/10.26131/IRSA662)
- spherex qr2 (superseded by dr1, referenced in early work): doi 10.26131/IRSA652
- gaia dr3 (proper-motion cross-match and arrows): esa/gaia, https://gea.esac.esa.int/archive/
- nasa/ipac irsa (sia queries, level 2 data, cutouts): https://irsa.ipac.caltech.edu/Missions/spherex.html
- astropy (fits, wcs, coordinates, zscale): https://www.astropy.org/
- astroquery (irsa access): https://astroquery.readthedocs.io/
- reproject (wcs alignment): https://reproject.readthedocs.io/
- scikit-learn (gradient boosting real-bogus classifier): https://scikit-learn.org/
- live site: https://elsayedelmandoh-planetx-nasa26.static.hf.space/ ; repo: https://github.com/elsayedelmandoh/planetx-nasa26

**honest limits:**
- static site: all processing runs offline in the pipeline; the deployed demo serves precomputed frames for the cached benchmark targets only. live queries for arbitrary coordinates do not run in production.
- bright stars saturate: saturated cores render white, not a magnitude; barnard's star shows this.
- few epochs: 3 survey passes for barnard's star and wise 0855, 4 for epsilon indi b; rw aurigae and r draconis have no cached frames yet (pending).
- motion scale: ~1.3-1.7 px/yr at 6.15"/px; blink alone barely shows the benchmark movers, so difference images, gaia proper-motion arrows, and 4x display upsampling are required.
- ml trained on injected movers in real spherex difference images; injected sources only approximate real psf and noise; scores rank candidates, they are not discoveries.
- planet x is the motivation, not a discovery. no discovery is claimed anywhere in the project.
- wise 0855 astrometry (luhman and esplin 2016) marked unverified in cache json; barnard's star and epsilon indi b astrometry from gaia dr3.

**team (names and roles, no emails):**

| member | role |
|---|---|
| elsayed elmandoh | data engineer, research, project lead |
| youssef | web frontend |
| mostafa | research (scientific validity) |
| salma | research |
| hazem | devops and coding |
| mohsen | graphics (video, slides, logo, ui polish) |

---

## 30-second video script

| seconds | on screen | voice-over |
|---|---|---|
| 0-5 | open live site https://elsayedelmandoh-planetx-nasa26.static.hf.space/ ; intro/landing view, headline "spherex sky blink" | "spherex images the whole sky every six months. we made it blink." |
| 5-12 | click the "wise 0855" preset button in the benchmark targets group; blink view loads pass-1/2/3 (d6 stack) | "pick any of the five benchmark targets. coadded survey passes load instantly." |
| 12-20 | press play on the player; point at the a-b difference frame (diff-1-2, diff-2-3); mover appears as a dipole | "press play. the fast-moving brown dwarf betrays itself as a dipole in the difference image." |
| 20-26 | switch preset to "barnard's star"; switch mode toggle from blink to difference; show the expected-motion arrow (motion from first to last pass) | "barnard's star, ten arcseconds a year. the arrow shows the expected motion from gaia dr3 proper motion." |
| 26-30 | show detector markers with ml score on a difference frame (epsilon indi b has markers with scores); end card with repo + space apps badge | "markers flag moving candidates with an ml score. no claims, just candidates. open source, on github." |

notes for mohsen: exact control names in the ui: `#presets` (benchmark targets), `#play-toggle` (play/pause), `#mode-toggle` (blink/difference), `#marker-legend`, canvas `#player`. video must not exceed 30 s. no discovery language.

---

## slides outline

6-8 slides. each lists title, 2-3 bullets, judging criterion served.

1. **planetx-nasa26: spherex sky blink** - public blink tool for spherex survey passes; 2026 nasa space apps, planet x and spherex; live demo + public repo. *(presentation)*
2. **the problem** - spherex: 102 bands, >1e9 objects, whole sky every 6 months; movers and variables reveal themselves between epochs; no person can sift it alone; planet x as motivation, not promise. *(impact, relevance)*
3. **what it does** - ra/dec input (decimal or sexagesimal), 5 benchmark presets, fov selector; blink player across survey passes; difference imaging and gaia dr3 proper-motion arrows; detector markers with ml score. *(relevance)*
4. **how it works** - level 2 cutouts masked with ext 2 flags; reprojected to common wcs; nanmedian coadd per pass (~20 visits); zscale png served statically; rule-based dipole detection + gradient boosting scorer. *(validity, creativity)*
5. **demo: wise 0855 and barnard's star** - wise 0855 shifts across 3 d6 passes (~8.1"/yr); barnard's star across 3 d2 passes (~10.3"/yr, saturating core); epsilon indi b 4 passes with scored dipole markers. *(validity, presentation)*
6. **honest limits** - static site, precomputed targets only; saturation; few epochs (2 targets pending: rw aurigae, r draconis); ml on injected movers; upsampling adds visibility, not information. *(validity)*
7. **why it matters** - citizen-science triage for >1e9 sources; every visit public via the live site; open code, open data, irsa credit; embeddable via url params. *(impact)*
8. **team and links** - team table (roles); live site url; github repo url; spherex dr1/qr3 dois; one-line honesty footer: "planet x is the motivation, not a discovery." *(presentation, relevance)*

---

## judging criteria checklist

1. **impact** - what we show: 5 benchmark targets one click away on the live site (`#presets`); public, no login, embeddable `?ra=&dec=&fov=` url params; built for the >1e9-source triage problem stated in the challenge. evidence: live site, repo.
2. **creativity** - what we show: blink + difference imaging combined in one canvas; per-pass coadds across ~20 visits; dipole detector with ml scoring of candidates; 4x upsampling for sub-2px/yr motion visibility; honest "unmatched moving candidate" labels. evidence: difference mode toggle, markers with ml score on epsilon indi b diff frames, `src/utils/ml_classifier.py`.
3. **validity** - what we show: ext 2 flag masking (transients/persistence/dead pixels dropped, source kept); common tangent-plane wcs reprojection; gaia dr3 astrometry with proper-motion propagation for epoch positions; dipole sign check; saturation rendered white not as a magnitude; no discovery claims; mostafa verifying expected shifts per target. evidence: `src/utils/data_processing.py`, per-target json in `web/cache/`, astrometry_source fields.
4. **relevance** - what we show: coordinate input (ra/dec, both formats), blink player (required), all 5 required benchmark targets as presets, difference imaging (recommended feature), url query params (recommended), spherex dr1 + qr3 (current releases; qr2 dropped, 0 sia rows). evidence: presets group on live site, `configs/default.yaml`, cache json epoch labels.
5. **presentation** - what we show: single-page dark ui, one-click presets, 30-second video, this page's project description and slides; public repo with readme and team table. evidence: live site, readme, video.

---

## per-target table

filled from web/cache/index.json and per-frame json. "pending" = no frames cached yet.

| target | detector | survey passes (epoch labels) | visits per pass | what to look for |
|---|---|---|---|---|
| wise 0855 | d6 | 2025-05 (3 visits), 2025-11/12 (20), 2026-04/05 (20) | 3 / 20 / 20 | mover: dipole in diff-1-2 (2025-11/12 minus 2025-05) and diff-2-3 (2026-04/05 minus 2025-11/12); expected ~8.1"/yr; arrow from first to last pass |
| barnard's star | d2 | 2025-08 (14), 2026-03 (15), 2026-08/09 (19) | 14 / 15 / 19 | mover, but its ~1.7 px/yr motion falls inside the saturated core (rendered white), so the difference image cannot show a clean dipole; point to the expected-motion arrow and the halo shift instead (~10.3"/yr) |
| epsilon indi b | d6 | 2025-04/06 (23), 2025-09/11 (20), 2026-04/05 (11), 2026-09 (32) | 23 / 20 / 11 / 32 | mover: dipole in all 3 diff frames; detector markers labelled "known high-proper-motion object" with peak_sigma 52.5 / 55.6 / 39.5 and ml score `<recall from ml_metrics.json>` |
| rw aurigae | pending | pending | pending | variable: residual brightness change, not position; no frames cached |
| r draconis | pending | pending | pending | variable: residual over ~245.6-day period; no frames cached |

difference frame epoch labels: barnard's star diff-1-2 = "2026-03 minus 2025-08", diff-2-3 = "2026-08/09 minus 2026-03"; wise 0855 diff-1-2 = "2025-11/12 minus 2025-05", diff-2-3 = "2026-04/05 minus 2025-11/12"; epsilon indi b diff-1-2 = "2025-09/11 minus 2025-04/06", diff-2-3 = "2026-04/05 minus 2025-09/11", diff-3-4 = "2026-09 minus 2026-04/05". all frames 49x49 native, 6.15"/px, 4x upsampled, zscale (passes) / symmetric (diffs).

note: epsilon indi b markers carry no `ml_score` field yet in the cached markers json; present ml score as `<recall from ml_metrics.json>` until the classifier is rerun and markers are re-scored.
