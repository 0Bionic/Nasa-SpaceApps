# AetherHealth

**Offline astronaut health monitoring** for the 2026 NASA Space Apps Challenge — *Create Health Monitoring Software for Astronauts on Space Missions*.

AetherHealth helps crews self-assess vitals, sleep, mood, and body-region status when Earth is too far for real-time flight-surgeon support. It maps indicators to NASA’s five hazards of human spaceflight, color-codes triage (Green / Yellow / Amber / Red), and recommends Tier 1–3 countermeasures — fully offline as a Progressive Web App.

UI design: spacecraft instrument-plate layout (Huzaifa branch) with an interactive SVG body plate on the Status dashboard.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build + PWA assets
npm run preview  # serve the build
```

## Demo script (≈3 minutes)

1. **Hook** — Onboarding explains autonomy when Earth is ~20 minutes away.
2. **Dashboard** — Seeded Cmdr. Avery Chen on a lunar surface base; body plate shows mixed severity (latest seed check-in has critical SpO₂).
3. **Body plate** — Tap Respiratory / Behavioral regions; review status and Tier actions.
4. **Check-in** — Use *Sync mock sensors* or enter low SpO₂ / poor sleep; save; watch colors update.
5. **Trends** — Open 30-day sleep/mood charts; note anomaly callouts.
6. **Guidance + export** — Browse countermeasures; *Export ground packet* downloads FHIR-lite JSON for uplink.

## Features

| Feature | Status |
| --- | --- |
| Crew profile & mission environment | Done |
| Daily check-in + mock sensor sync | Done |
| Interactive instrument body plate | Done |
| Color-coded triage + explainability | Done |
| Trend charts (7/30 day) | Done |
| Routines + XP / streaks / badges | Done |
| Guidance library + hazard primer | Done |
| Offline PWA | Done |
| FHIR-lite ground packet export | Done (stretch) |

## Tech stack

Vite · React 18 · TypeScript · Tailwind · Dexie · Zustand · Recharts · vite-plugin-pwa

## Project docs

Full team plan, problem→feature matrix, 4-dev split, and thresholds: [`docs/AHMS-Project-Plan.md`](docs/AHMS-Project-Plan.md)

Challenge reference brief: [`in md file of 10 pages.md`](in%20md%20file%20of%2010%20pages.md)

Implementation / video overview: [`docs/Implementation-and-Video-Overview.md`](docs/Implementation-and-Video-Overview.md)

## Team ownership (4 developers)

| Dev | Focus |
| --- | --- |
| A | `src/domain/**`, `src/data/**` — triage, Dexie, seed, export |
| B | `src/app/**`, check-in, routines, gamification, profile |
| C | `src/features/bodymap/**` — body plate & severity colors |
| D | trends, guidance, onboarding, README / demo polish |

## Disclaimer

AetherHealth is an educational Space Apps prototype. Thresholds are illustrative and **not** clinical or flight-surgeon protocol.
