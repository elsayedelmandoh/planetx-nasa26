# planetX-nasa26 — Planet X and SPHEREx
**Event:** 2026 NASA Space Apps Challenge ("The Next Frontier")  
**Challenge:** Planet X and SPHEREx  
**Difficulty:** Advanced  
**Subjects:** Astrophysics · Planets & Moons · Software  

---

## 1. Official Links & Navigation

| Resource | URL |
| :--- | :--- |
| **Official Challenge Page (Details)** | https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/ |
| **Challenge Resources Tab** | https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources |
| **Challenge Teams Tab** | https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=teams |
| **Space Apps 2026 Home** | https://www.spaceappschallenge.org/2026/ |
| **2026 All Challenges Directory** | https://www.spaceappschallenge.org/2026/challenges/ |
| **Local Events Directory (500+ Locations)** | https://www.spaceappschallenge.org/2026/local-events/ |
| **Find a Team** | https://www.spaceappschallenge.org/2026/find-a-team/ |
| **Participant Guides & FAQs** | https://www.spaceappschallenge.org/resources/ |
| **Participant Terms & Conditions / Legal** | https://www.spaceappschallenge.org/legal/ |
| **NASA Official Announcement** | https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge/ |

---

## 2. Event Timeline & Facts

* **Hackathon Dates:** Saturday, November 14 – Sunday, November 15, 2026
* **Registration Window:** Opened August 26, 2026; remains open until the hackathon concludes on November 15, 2026. *(All team members must register to be eligible for Global Judging).*
* **Team Size:** 1 to 6 members per team.
* **Format:** In-person local events worldwide + Universal Event (remote participation); free and open to all ages/skill levels.
* **Local Judging Period:** November 16 – November 22, 2026 (Local Winners & Global Nominees announced ~Nov 23–24).
* **Challenges in 2026:** 14 total (set by NASA and partner space agencies); this one is labelled Advanced.
* **Data/resources release:** some local organizers note full challenge data and resources go live Fri Nov 13, 2026 — re-check the Resources tab.
* **Global Judging:** December 2026 (Global Finalists & Honorable Mentions) $\rightarrow$ January 2027 (Global Winners announced).

---

## 3. Official Challenge Statement (Full Text)

### Summary
> Since 2025, NASA's SPHEREx mission has been mapping the entire sky every six months in 102 bands of near-infrared light, returning images of more than a billion objects. Comets, asteroids, stars, brown dwarfs, and even new planets reveal themselves by shifting position between images, but no one person can sift through all that data alone. Your challenge is to create a public-facing web tool to display images of the sky from the SPHEREx mission, making it easy for anyone to quickly see how they change over time.

### Background
Asteroids and comets orbit around the Sun. Nearby stars march across the sky as they orbit around the Galaxy. The Earth orbits the Sun too, causing objects near us to change their apparent positions. Watching for these motions helps us discover new astronomical objects and also helps measure the distances to these objects. For example, the dwarf planet Pluto was discovered when an astronomer compared two images of the sky taken at different times and recognized that one point of light had shifted between images.

More recently, astronomers have mounted massive searches for nearby objects using this process with help from the public. Hundreds of thousands of volunteers have used this technique to discover asteroids, comets, stars, and brown dwarfs—balls of gas too massive to be considered planets yet without enough mass to burn like stars. In fact, most of the known comets and brown dwarfs were discovered by volunteers in this manner through projects like [Backyard Worlds: Planet 9](https://www.backyardworlds.org/).

Since May 2025, NASA's new SPHEREx mission has been returning unique data that could yield new discoveries. SPHEREx is mapping the whole sky once every six months in 102 bands of near-infrared light, making it uniquely sensitive to objects that are rich in hydrogen, water ($H_2O$), carbon dioxide ($CO_2$), carbon monoxide ($CO$), and many other molecules. There will be too much data for any one person or even computer code to completely comprehend. There will be images of more than a billion objects—including brown dwarfs, quasars, comets, asteroids, stars, supernovae, and galaxies—which often overlap or vary in brightness. We need your creative new tools to make the most of this treasure trove and help as many people as possible pitch in to make discoveries.

### Objectives
Your challenge is to create a **public-facing web tool** to display images of the sky from the SPHEREx mission, making it easy for anyone to quickly see how they change over time:
1. **Coordinate Input:** Users will enter the coordinates of a patch of sky — **Right Ascension ($\alpha$ / RA)** and **Declination ($\delta$ / Dec)**.
2. **Time-Series / Blink Visualization:** Your tool will display a series of images of that patch like a little video, making it easy to spot moving or variable objects.
3. **Required Benchmark Targets:** Test your tool on:
   * **Barnard's Star** (high proper-motion red dwarf)
   * **Epsilon Indi B** (a pair of brown dwarfs orbiting a star)
   * **WISE 0855** (a fast-moving brown dwarf at RA `08h 55m 10.831s`, Dec `-07d 14m 42.53s`)
   * **RW Aurigae** (variable star)
   * **R Draconis** (variable star)

### Potential Considerations (Recommended Features)
You may (but are not required to) consider the following to make your submission stand out:
* **Scalable Data Ingestion:** New SPHEREx data is arriving fast! Make sure to design a tool that's easy to update with the latest data releases (e.g., QR2, QR3, DR1).
* **102-Band Visualization & Detector Stacking:** Think creatively about how to display those 102 infrared bands so users can take advantage of them to make new discoveries! For example, it may make sense to separately add together all the data taken by each of the **six detector arrays** to improve the signal-to-noise ratio (SNR) in the images you display.
* **On-the-Fly Spectra (Extra Kudos!):** Extra kudos if your tool can generate 102-band spectra on the fly for selected sources.
* **Image Coaddition & Difference Imaging:** It may help users discover moving objects if they have the options to **add together** (stack) or **subtract** (difference image) images taken at different times.
* **Customizable Field of View (FoV):** Let users choose the field of view! Larger fields of view can make it possible to track faster-moving sources, at the cost of longer data transfer times.
* **Multi-Mission Overlays:** Users could benefit from having the option to overlay astronomical data from other telescopes, such as the **Gaia mission** or the **WISE mission**.
* **URL Query Parameters & Embeddability:** If you make it possible to query your tool by including coordinates in the URL (e.g., `?ra=133.795&dec=-7.245&fov=0.1`), users will be able to easily embed it in other websites and projects.
* **Metadata & Quality Flags:** It can be useful to display metadata, like **contamination flags** (e.g., per-pixel status and processing flags in FITS Extension 2).
* **Existing Astro Libraries:** Consider looking for publicly available tools that may help in handling astronomical data, like the **Astropy** tools, and in displaying astronomical data, like the **Aladin** tool (Aladin Lite) developed by the Strasbourg Astronomical Data Center (CDS).

---

## 4. Official Benchmark Targets & Coordinates Reference

Use these exact coordinates in your web app as quick-select preset buttons so judges can immediately verify your tool against the prompt's test cases:

| Target Name | Object Type / Behavior | RA (Sexagesimal) | Dec (Sexagesimal) | RA (Deg) | Dec (Deg) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WISE 0855** *(WISE J085510.83−071442.5)* | Fast-moving Y-dwarf (coldest known brown dwarf, $7.4\text{ ly}$ away) | `08h 55m 10.831s` | `-07d 14m 42.53s` | $133.795129^\circ$ | $-7.245147^\circ$ | **Explicitly given in prompt.** Proper motion $\sim 8.1\text{ arcsec/yr}$. |
| **Barnard's Star** *(GJ 699 / HIP 87937)* | High proper-motion M4 red dwarf ($5.96\text{ ly}$ away) | `17h 57m 48.498s` | `+04d 41m 36.11s` | $269.452075^\circ$ | $+4.693364^\circ$ | Fastest proper motion of any star ($\sim 10.3\text{ arcsec/yr}$). |
| **Epsilon Indi B** *($\varepsilon$ Indi Ba/Bb)* | Binary T-type brown dwarfs (T1 + T6) orbiting $\varepsilon$ Indi A | `22h 04m 10.595s` | `-56d 46m 58.24s` | $331.044147^\circ$ | $-56.782844^\circ$ | Proper motion $\sim 4.7\text{ arcsec/yr}$. *(Host star $\varepsilon$ Ind A is at `22h 03m 21.65s`, `-56d 47m 09.52s`)*. |
| **RW Aurigae** *(HD 240764 / HIP 23873)* | T Tauri young binary variable star | `05h 07m 49.53s` | `+30d 24m 05.0s` | $76.956375^\circ$ | $+30.401389^\circ$ | Exhibits chaotic brightness dips from circumstellar dust occultations. |
| **R Draconis** *(HD 149880 / HIP 81014)* | Mira-type pulsating variable red giant | `16h 32m 40.23s` | `+66d 45m 18.0s` | $248.167625^\circ$ | $+66.755000^\circ$ | Brightness varies strongly over a $\sim 245.6\text{-day}$ period. |

---

## 5. Datasets, APIs & Technical Resources

### A. Official NASA / IPAC SPHEREx Data Archives & Tools
| Resource Name | Description | URL / Command |
| :--- | :--- | :--- |
| **IRSA SPHEREx Mission Hub** | Primary portal for SPHEREx Data Release 1 (DR1, Nov 2026) and Quick Releases (QR2/QR3). | https://irsa.ipac.caltech.edu/Missions/spherex.html |
| **SPHEREx Data Explorer (GUI & Search)** | Interactive search and visualization for SPHEREx Spectral Images, Cutouts, and Mosaics. | https://irsa.ipac.caltech.edu/onlinehelp/spherex/spherex/faq.html |
| **SPHEREx Archive User Guide & Tutorials** | Official Caltech/IPAC documentation, Python notebooks (Cutouts, PSF, Mosaic Cubes, HiPS Cubes, Source Discovery). | https://caltech-ipac.github.io/spherex-archive-documentation/ |
| **IRSA Cloud Data Access Guide** | Instructions for anonymous access to SPHEREx FITS files on AWS S3. | https://irsa.ipac.caltech.edu/cloud_access/ |
| **AWS Open Data Registry (SPHEREx QR)** | AWS S3 dataset description and structure for `nasa-irsa-spherex` (`us-east-1`). | https://registry.opendata.aws/spherex-qr/ |
| **AWS S3 Browsable Bucket Index** | Direct HTTP directory listing of the SPHEREx S3 bucket. | https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/index.html |
| **AWS CLI Anonymous Access** | Command to list calibrated Level 2 Spectral Images (no AWS account required). | `aws s3 ls --no-sign-request s3://nasa-irsa-spherex/qr2/level2/` |

### B. SPHEREx FITS File Structure & Instrument Characteristics
* **Spectral Coverage:** $\lambda = 0.75\text{ }\mu\text{m}$ to $5.0\text{ }\mu\text{m}$ across **102 spectral bands** using Linear Variable Filters (LVFs) across two Focal Plane Assemblies (FPAs) split by a dichroic beam splitter.
* **6 Detector Bands (Simultaneous Pairs):**
  * **Band 1:** $0.75 - 1.1\text{ }\mu\text{m}$ ($R = 39$) & **Band 4:** $2.4 - 3.8\text{ }\mu\text{m}$ ($R = 35$) — *imaged simultaneously*
  * **Band 2:** $1.1 - 1.6\text{ }\mu\text{m}$ ($R = 41$) & **Band 5:** $3.8 - 4.4\text{ }\mu\text{m}$ ($R = 112$) — *imaged simultaneously*
  * **Band 3:** $1.6 - 2.4\text{ }\mu\text{m}$ ($R = 41$) & **Band 6:** $4.4 - 5.0\text{ }\mu\text{m}$ ($R = 128$) — *imaged simultaneously*
* **Multi-Extension FITS (MEF) Format (`qr2/level2` & `dr1`):**
  * `Ext 1`: Calibrated Spectral Image
  * `Ext 2`: Per-pixel status and processing flags (contamination/quality flags)
  * `Ext 3`: Variance map
  * `Ext 4`: Zodiacal light model
  * `Ext 5`: Exposure-averaged Point Spread Function (PSF)
  * `Ext 6`: Wavelength World Coordinate System (WCS)

### C. Recommended External Tools, Libraries & Complementary Catalogs
* **Citizen Science Inspiration:** [Backyard Worlds: Planet 9](https://www.backyardworlds.org/)
* **Astronomical Data Handling (Python):**
  * [Astropy](https://www.astropy.org/) (`astropy.io.fits`, `astropy.wcs`, `astropy.coordinates`)
  * [Astroquery](https://astroquery.readthedocs.io/) (`astroquery.ipac.irsa`, `astroquery.simbad`, `astroquery.gaia`)
  * [reproject](https://reproject.readthedocs.io/) (for aligning multi-epoch FITS images to a common WCS grid before blinking or subtracting)
* **Web Visualization & Sky Overlays:**
  * [Aladin Lite (CDS)](https://aladin.cds.unistra.fr/AladinLite/) — HTML5/WebGL sky atlas supporting HiPS overlays for **Gaia**, **WISE / unWISE**, **2MASS**, and custom FITS layers.
  * [CDS SIMBAD Astronomical Database](https://simbad.cds.unistra.fr/simbad/) — Resolve object names (e.g., `"Barnard's Star"`) to RA/Dec coordinates.
* **Solar System & Moving Object Matching:**
  * [IRSA Moving Object Search Tool (MOST)](https://irsa.ipac.caltech.edu/applications/MOST/)
  * [JPL Small-Body Identification (SBIdent)](https://ssd.jpl.nasa.gov/tools/sbident.html) & [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)
* **Multi-Mission Overlay Archives:**
  * [ESA Gaia Archive](https://gea.esac.esa.int/archive/)
  * [WISE / NEOWISE at IRSA](https://irsa.ipac.caltech.edu/Missions/wise.html)

---

## 6. NASA Space Apps Judging Criteria

Ensure your final application and 30-second video/slide presentation address all five official NASA Global Judging Criteria:
1. **Impact:** How much impact (quality and quantity) can this project have? Does it solve a big problem (helping citizen scientists and astronomers sift through $>10^9$ SPHEREx sources)?
2. **Creativity:** How creative/innovative is the approach? (e.g., clever 6-detector band stacking, interactive difference imaging, on-the-fly 102-band spectroscopy).
3. **Validity:** Is the solution scientifically valid? Does it properly handle WCS coordinates, LVF wavelength shifts, contamination flags, and distinguish real motion/variability from artifacts?
4. **Relevance:** Is this project responsive to the challenge for which it was submitted? Does it include the required coordinate input, time-series blink player, and test targets?
5. **Presentation:** How well did the team communicate their project? Is the UI intuitive for the public, and is the documentation/demo clear?

---

## 6b. SPHEREx Mission Quick Facts (extra context)

* Full name: Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer; running a full-sky spectral survey.
* Orbits Earth ~14.5 times per day, ~3,600 images per day; whole sky in ~6 months; two-year primary mission, so several full-sky passes (epochs) are expected, which is what enables change detection.
* Six detectors, each paired with filters; stacking per detector raises SNR.
* Data credit: NASA / JPL-Caltech / IPAC via the NASA/IPAC Infrared Science Archive (IRSA).
* Companion small-body data: JPL SBIdent and JPL Horizons for known-object matching and ephemerides.

## 6c. Scientific Honesty Notes (our framing)

* Planet X is the motivation, not a promised result. Do not claim a discovery.
* Label outputs as "observed change" vs "candidate" and keep decorative guide elements separate from real detections.
* Distant planets may be too faint for single SPHEREx exposures; keep claims modest and test on known movers (e.g. WISE 0855, Barnard's Star) first.
* Other teams' repos report blind searches that find few true candidates among many chance ones; validate on simulated or known objects.

---

## 7. Project Architecture & Feature Blueprint (Our Notes)

### Core Workflow
1. **Input Layer & URL State:**
   * Search bar accepting `RA, Dec` (decimal degrees or sexagesimal `HHh MMm SSs`) **or** target name resolved via SIMBAD/Astropy.
   * Preset buttons for the **5 Official Test Targets** (`Barnard's Star`, `Epsilon Indi B`, `WISE 0855`, `RW Aurigae`, `R Draconis`).
   * URL query sync (`?ra=...&dec=...&fov=...&mode=blink`) for instant sharing and iframe embedding.
   * Field-of-View (FoV) selector (e.g., $2'$, $5'$, $15'$, $30'$) with transfer-size estimate.
2. **Data Processing Pipeline (Python Backend / Pre-Cached Cutouts):**
   * Query IRSA SPHEREx Cutout Service / S3 (`s3://nasa-irsa-spherex/qr2/level2/` or `dr1`) across available observation epochs.
   * **WCS Reprojection:** Align all epochs to a uniform tangent-plane WCS grid.
   * **Detector Array Stacking:** Option to stack exposures per detector array (Bands 1–6) to boost SNR, or view individual LVF sub-bands.
   * **Difference & Coadd Modes:** Compute `Epoch B - Epoch A` (difference image to highlight dipoles/movers and variable stars) and `Epoch A + Epoch B` (coadd).
   * **Metadata & Flag Overlay:** Parse `Ext 2` bitmask flags to toggle contamination/bad-pixel warnings on the canvas.
3. **Interactive Web Frontend:**
   * **Time-Series Video / Blink Player:** Play/pause, frame-rate slider, manual epoch scrubbing, and side-by-side / swipe comparison.
   * **Catalog Overlays:** Toggle **Gaia DR3** (with proper motion vectors), **WISE**, and **JPL SBIdent** known solar system bodies.
   * **On-the-Fly 102-Band Spectrum Viewer ("Extra Kudos" Feature):** Click any pixel/source to plot flux across $\lambda \in [0.75, 5.0]\text{ }\mu\text{m}$ with molecular absorption band markers ($H_2O$, $CO$, $CO_2$, $CH_4$).
   * **Honest Scientific Framing:** Frame "Planet X" as the scientific motivation; label detections clearly as *"Known High-Proper-Motion Object"*, *"Variable Source"*, or *"Unmatched Moving Candidate"*.

---

## 8. Public Reference Repos (Other Teams)
*Use these for architectural inspiration and to see how others interact with the `nasa-irsa-spherex` bucket. Always respect open-source licenses:*
* https://github.com/epsretriever/spherex-planet-x
* https://github.com/shivbhardwaj009/spherex-sky-diary
* https://github.com/mateibut/SPHEREx
* https://github.com/roshcr6/NASA2026
* https://github.com/satyam46inv137/one-over-137-planet-x

---

## 9. Hackathon Execution Checklist
- [ ] Confirm team registration on [spaceappschallenge.org](https://www.spaceappschallenge.org/2026/)
- [ ] Pre-fetch and cache SPHEREx cutouts for the **5 required benchmark targets** (`Barnard's Star`, `Epsilon Indi B`, `WISE 0855`, `RW Aurigae`, `R Draconis`) so the live demo works instantaneously
- [ ] Implement RA/Dec + URL query parameter input (`?ra=...&dec=...&fov=...`)
- [ ] Build the multi-epoch blink / video scrubber + difference imaging toggle (`A - B`, `A + B`)
- [ ] Add 6-detector band selector + on-the-fly 102-band spectral plot
- [ ] Add Gaia / WISE overlay toggle and contamination flag (`Ext 2`) indicator
- [ ] Include official NASA/IRSA SPHEREx data acknowledgement & DOIs (`10.26131/IRSA652`) in the footer/README
- [ ] Deploy public web app, push code to public GitHub repo, and submit project page before November 15 closing deadline