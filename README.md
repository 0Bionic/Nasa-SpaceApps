# AetherHealth

**Offline health monitoring for astronauts when Earth can't answer in time.** Built for the 2026 NASA Space Apps Challenge, *Create Health Monitoring Software for Astronauts on Space Missions*.

Mars is, on average, 140 million miles from Earth, and a radio message can take up to ~20 minutes each way. When something feels wrong, the crew has to decide on their own. AetherHealth turns a two-minute daily check-in into color-coded triage, early warnings and step-by-step actions, all on-device and offline. Every threshold shows where it comes from.

## What it does

| | |
| --- | --- |
| **Analytics (home)** | Indicators that need attention first, glowing sparklines, a review window, Trend / Range / Risk / Countermeasure tabs and stat tiles |
| **Guided protocol** | A critical reading opens an offline checklist: stop and stabilise, re-measure, tiered actions, a 5-minute recheck timer, an event log, and the earliest possible ground reply |
| **Mission profiles** | Low Earth orbit, lunar surface or Mars transit: gravity, signal delay and the measured radiation background for that destination |
| **Compounding hazards** | Rules that catch hazards feeding off one another, e.g. high CO₂ with poor sleep, or low fluids with dizziness |
| **Early warning** | A straight-line fit of the last 7 check-ins flags readings that are still nominal but heading out of range ("likely Caution in ~3 check-ins") |
| **Continuous monitoring** | The **Monitor** page, scoped to where NASA and CSA use continuous sensing: live **EVA** and **exercise** sessions (heart rate, SpO₂, breathing, signal quality) with on-device alerts that ignore dropouts and motion artifact; **24-hour recording sessions** (playable at 60× / 600×) stored on the device and sent with the next ground packet; continuous **sleep actigraphy**; a live **radiation dosimeter**. See [`docs/Continuous-Monitoring-Evidence.md`](docs/Continuous-Monitoring-Evidence.md) |
| **Radiation budget** | Estimated mission dose tracked against NASA's 600 mSv career limit (NASA-STD-3001), not just a daily number |
| **Live NASA space weather** | Solar flares and solar energetic particle events from NASA's DONKI service (api.nasa.gov), cached for offline use with a "last synced" time; a recent event flags shelter readiness and EVA no-go |
| **Personal baselines** | Each reading is also compared with the astronaut's own last 14 check-ins; 2+ standard deviations away is flagged "unusual for you" even inside the normal range |
| **EVA & vehicle readiness** | Go / caution / no-go before a spacewalk or rover drive, from oxygen, balance, fatigue, sleep, temperature, heart rate, blood pressure and space weather |
| **Why this color** | Every alert shows the band it fell in, all bands, the reasoning, the NASA risk it watches, and linked sources |
| **17 indicators** | Vitals, sleep, mood, stress, fatigue, crew cohesion, dizziness, exercise, resistive exercise, fluid intake, cabin CO₂, radiation |
| **NASA risk coverage** | 12 of the 17 NASA HRP risks are monitored; the other 5 are listed with the reason (they need suit, vehicle or microbial sensors) |
| **Crew board** | The crew medical officer's view of everyone, worst first, with early warnings (crewmates are simulated for the demo) |
| **Body map** | Tap a region to see its status and tiered actions |
| **Tiered actions** | Self-care → Crew Medical Officer → Ground, with a FHIR-style ground packet export |
| **Uplink queue** | Each exported packet shows its transit time and the earliest reply, using the habitat's real signal delay (up to 22 min to Mars) |
| **On Earth** | Remote clinics, older adults, isolated crews and chronic conditions, plus an **Earth mode** that rewords the app for clinic use |
| **Light / dark mode** | NASA theme (black or white, NASA blue, NASA red); light is the default |
| **Offline PWA** | Installs and runs with no network; data stays in the browser (IndexedDB) |

## Grounded in NASA and CSA research

| Source | How AetherHealth uses it |
| --- | --- |
| [NASA HRP: 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) | Every indicator maps to the five hazards, named exactly as NASA does; hazards are shown together because they "feed off one another" |
| [NASA HRP: Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) | Each threshold names the NASA risk it monitors; the Guidance page shows coverage of all 17 risks |
| [NASA HRP: Ongoing Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | The daily check-in mirrors **Standard Measures** and **ARCHeR** (sleep, well-being, activity on Artemis II); the ground packet plays the role of **Tempus Pro** telemedicine data |
| NASA-STD-3001 (Vols 1 and 2) and OCHMO technical briefs ([CO₂](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf), [radiation](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf), [standards overview](https://www.nasa.gov/sites/default/files/atoms/files/ochmo_standards_overview_sept_15_2021_francisco.pdf)) | Cabin CO₂ bands: green to 2.5 mmHg, yellow to the 3 mmHg limit [V2 6004], red above 4.5 mmHg. Radiation: daily bands at NASA's 0.8 / 1.3 mSv/day design limits, 600 mSv career [V1 4030], 250 mSv per solar event |
| [NASA DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) via [api.nasa.gov](https://api.nasa.gov/) | Live solar flares and SEP events on the Analytics page and in EVA readiness |
| [CSA: Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Cumulative radiation tracking; neutrons are ~30% of ISS radiation, and an autonomous monitor like CANS could feed the radiation card |
| [OCHMO-STD-100.1A](https://www.nasa.gov/wp-content/uploads/2023/04/ochmo-std-100.1a.pdf), [CSA Bio-Monitor](https://www.asc-csa.gc.ca/eng/sciences/astroskin.asp), NASA–CSA HERA Astroskin study | The Monitor page: live ECG/heart rate during EVA [6030], continuous sleep measurement [6039], radiation dosimetry [6022]; Bio-Monitor-style recording sessions stored on the device, because live streaming drained the battery in HERA |
| [CSA: Why do we conduct science in space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp) | The "On Earth" page: aging, osteoporosis, cardiovascular disease, Type-2 diabetes and remote care |

Each threshold is labelled **NASA standard** (cabin CO₂, radiation), **Clinical guideline** (AASM/SRS sleep, ACC/AHA blood pressure, ADA glucose, WHO pulse oximetry) or **App heuristic** (self-report scales, exercise and fluid cut-offs that still need expert review). Measured unshielded backgrounds (MSL RAD ≈1.84 mSv/day in deep space, Chang'e-4 ≈1.37 mSv/day on the Moon) are shown for context in the mission profile. CO₂ ppm values assume a 1-atmosphere cabin; NASA writes the limit in mmHg. The full table and reference list are in the app under **Guidance → Sources & method**, and in [`src/domain/evidence.ts`](src/domain/evidence.ts).

## Demo script (about 3 minutes)

1. **Hook (15 s).** "Mars is 140 million miles away. When an astronaut feels wrong, Earth can't answer in time."
2. **Analytics (40 s).** The app opens on Analytics with a red **Critical: SpO₂ 88%** banner (one critical, one warning, a few cautions: no alarm fatigue). Point out the mission profile, **EVA readiness: NO-GO**, and **Compounding hazards**: cabin CO₂ above NASA's 2.5 mmHg line is a likely common cause of low SpO₂ and poor sleep.
3. **Why this color (30 s).** Select SpO₂, open the **Risk** tab: 88% is in the red band (≤ 89%), based on the WHO hypoxaemia threshold, monitoring NASA's *Risk of Hypoxia*. Switch to Cabin CO₂ to show the NASA-STD-3001 citation.
4. **Guided protocol (25 s).** Tap **Start guided protocol**: tick a step, start the 5-minute recheck timer, and note the earliest ground reply.
5. **Radiation and live space weather (15 s).** Show the mission dose against the 600 mSv career limit, then the NASA DONKI card (solar flares and particle events, last synced time).
6. **Check-in (25 s).** Open **Check-in**, tap **Fill from sensors**, set SpO₂ low and dizziness to 6, and save. The Status page and body map update.
7. **Crew board (15 s).** Open **Crew**: the CMO sees everyone, worst first, with early warnings.
8. **Ground packet (15 s).** On Analytics, tap **Export to ground**: the packet downloads and the uplink queue shows it in transit, then delivered.
9. **On Earth (15 s).** Open **On Earth** and switch on **Earth clinic**: the same engine now speaks to a remote clinic. Close on the NASA risk coverage (12 / 17) in Guidance.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). The app seeds a demo crew member (Cmdr. Avery Chen, lunar surface base, mission day 47) with 30 days of history.

```bash
npm run build    # type-check + production build + PWA assets
npm run preview  # serve the build
npm run build:artifact  # hosted-preview build (relative paths, no service worker, packet shown in a copy window)
```

To reset the demo before recording, open **Crew → Reset demo data**. It deletes local data on this device and reloads the 30-day demo history.

## How it works

```
Check-in (or sensor sync)
   │
   ▼
Triage engine ── thresholds + evidence (src/domain/indicators.ts, evidence.ts)
   │               └─ readings rounded to recorded precision → exactly one band
   ├── severity per indicator → body regions → overall status
   ├── early-warning forecast (src/domain/forecast.ts)
   ├── mission profiles + compounding-hazard rules (src/domain/mission.ts)
   ├── tiered countermeasures (src/domain/countermeasures.ts)
   └── ground packet (FHIR-style JSON, src/data/exportPacket.ts) → simulated uplink queue (src/data/uplink.ts)
          │
          ▼
IndexedDB (Dexie) — offline, on-device
```

**Stack:** Vite · React 18 · TypeScript · Tailwind (CSS-variable theme) · Dexie · Zustand · Recharts · vite-plugin-pwa

## Project docs

- Team plan and thresholds: [`docs/AHMS-Project-Plan.md`](docs/AHMS-Project-Plan.md)
- Challenge brief: [`in md file of 10 pages.md`](in%20md%20file%20of%2010%20pages.md)
- Continuous monitoring evidence (NASA/CSA): [`docs/Continuous-Monitoring-Evidence.md`](docs/Continuous-Monitoring-Evidence.md)
- Implementation / video overview: [`docs/Implementation-and-Video-Overview.md`](docs/Implementation-and-Video-Overview.md)

## Team ownership (4 developers)

| Dev | Focus |
| --- | --- |
| A | `src/domain/**`, `src/data/**` — triage, evidence, forecast, Dexie, seed, export |
| B | `src/app/**`, check-in, routines, gamification, profile, crew board |
| C | `src/features/bodymap/**` — body map and severity colors |
| D | analytics, guidance, On Earth page, README / demo polish |

## Honest claims

- **Rule-based, explainable triage.** No machine learning or AI diagnosis.
- **Sensors are simulated.** "Fill from sensors" and every Monitor-page signal (EVA, exercise, 24-h sessions, actigraphy, dosimeter) are generated; real wearables are future work. The exercise/EVA heart-rate ceiling (220 − age, age 40 assumed) is an app heuristic, not a NASA limit.
- **Body map is an interactive SVG diagram**, not 3D.
- **The ground packet is packaged, not secured.** Notes are sealed with a fixed demo passphrase; a real mission would use the agency's key management.
- **Crewmates on the crew board are simulated** from your own history.
- **Not clinically validated or NASA-approved.** CO₂ and radiation follow NASA-STD-3001; other bands are clinical guidelines or labelled heuristics.

## Use of AI

Claude (Anthropic) was used to review and test the code, fix bugs, write parts of the code and documentation, and draft the pitch deck and team playbook. All AI-assisted code was reviewed by the team. No AI-generated images, video or audio are used, and no NASA branding is used or modified. Each team member should add any other AI tool they used here and in the submission form.

## Limits and disclaimer

AetherHealth is an educational Space Apps prototype and a decision aid, **not** a diagnosis or a certified medical device. Thresholds are for adults at rest and are not personalised; self-report scales are not validated instruments; mission radiation is estimated from logged daily doses; app heuristics need flight-surgeon review before operational use.
