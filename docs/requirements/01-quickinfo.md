# planetX-nasa26 — Planet X and SPHEREx

NASA Space Apps Challenge 2026 · Challenge: **Planet X and SPHEREx**

> **Status of this file:** draft. The official challenge page blocks automated access, so the full statement, objectives, datasets and resource links are **not** copied here yet. Sections marked `TODO` need to be filled by pasting the page text. Everything else comes from public sources linked below.

---

## 1. Official links

| What | Link |
|---|---|
| Challenge page (source of truth) | https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/ |
| Space Apps 2026 home | https://www.spaceappschallenge.org/2026/ |
| Local events (450+ / 500+) | https://www.spaceappschallenge.org/2026/local-events/ |
| Participant terms & conditions (updated Aug 7, 2026) | https://www.spaceappschallenge.org/legal/ |
| NASA announcement | https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge/ |
| NASA/IPAC Infrared Science Archive (IRSA) | https://irsa.ipac.caltech.edu/ |

## 2. Event facts

- **Hackathon dates:** Saturday Nov 14 – Sunday Nov 15, 2026 (theme: "The Next Frontier")
- **Registration:** opened Aug 26, 2026; open until the hackathon closes on Nov 15. You must register to be eligible for Global Judging.
- **Format:** local events worldwide plus remote participation; free and open to all.
- **Number of challenges:** 14 for 2026.
- **Challenge tags:** Astrophysics · Planets & Moons · Software
- **Difficulty label:** Advanced
- **Data/resources release:** per one local organizer, full challenge data and resources follow on Fri Nov 13 (check the official page).

## 3. Challenge summary (public-facing blurbs)

Create a **public-facing web tool** that shows images of the sky from NASA's **SPHEREx** mission and makes it easy for anyone to quickly see how they **change over time**, revealing objects that move or change. The "Planet X" angle is the scientific motivation: a tool like this could help spot slow-moving distant bodies.

- Full statement: `TODO` (paste from official page)
- Objectives / constraints: `TODO`
- Suggested deliverables: `TODO`
- Judging criteria: `TODO`
- Datasets & resource links listed on the page: `TODO`

## 4. SPHEREx background

- Full name: Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer.
- Conducting a full-sky spectral survey in infrared; maps the sky in **102 wavelength bands** (about 0.75–5.0 µm).
- Orbits Earth about 14.5 times per day, taking roughly 3,600 images per day; covers the whole sky in about six months.
- Two-year primary mission, so several full-sky passes are expected, which is what makes change detection over time possible.
- Data credit: NASA / JPL-Caltech / IPAC, served via IRSA. SPHEREx Level 2 images are also available in the public `nasa-irsa-spherex` S3 bucket.
- Complementary data sources used by other teams: JPL SBIdent and JPL Horizons (known small-body matching and ephemerides).

## 5. Project idea space (our notes)

- Input: RA/Dec or target name → pull SPHEREx images of that patch across epochs.
- Views: blink / swipe / step through dates; difference imaging to highlight movers.
- Mover pipeline: source extraction → difference imaging → track linking → match against known bodies → flag unknowns.
- Optional: per-object 102-band spectra.
- Honest framing: Planet X is motivation, not a promised result. Label outputs as "observed change" vs "candidate".
- Planet X caveat: a distant planet may be too faint for single SPHEREx exposures, so keep claims modest.

Stack ideas (fits existing skills): Python pipeline + static web frontend (Next.js / FastAPI), cached cutouts, no heavy compute at request time.

## 6. Public repos from other teams (reference only)

- https://github.com/epsretriever/spherex-planet-x
- https://github.com/shivbhardwaj009/spherex-sky-diary
- https://github.com/mateibut/SPHEREx
- https://github.com/roshcr6/NASA2026
- https://github.com/satyam46inv137/one-over-137-planet-x

Use them to see what is already covered and to differentiate. Don't copy code without checking licenses.

## 7. Working checklist

- [ ] Register at spaceappschallenge.org and join a local event or team
- [ ] Paste full challenge statement into section 3
- [ ] Collect official dataset/resource links
- [ ] Decide scope (MVP: blink tool for one sky patch)
- [ ] Build, document, record demo
- [ ] Submit before the hackathon closes on Nov 15
