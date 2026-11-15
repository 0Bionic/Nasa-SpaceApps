# AetherHealth — Implementation Overview & 30-Second Video Guide

**Product:** AetherHealth  
**Challenge:** 2026 NASA Space Apps — Health Monitoring Software for Astronauts  
**Audience:** Team, judges, and anyone shooting the 30-second overview video

---

## 1. What we built (one paragraph)

AetherHealth is an **offline-first Progressive Web App** that lets astronauts log health indicators (vitals, sleep, mood, exercise), see status on an **interactive SVG body map**, understand **why** a result matters in the context of NASA’s five spaceflight hazards, and get **tiered next actions** (self-care → crew medical officer → ground packet). Seeded demo data makes a critical SpO₂ case visible immediately for demos and video.

---

## 2. What was implemented

| Area | What shipped |
| --- | --- |
| **Onboarding** | First-run overlay explaining autonomy when Earth is far away |
| **Dashboard** | Overall severity, critical banner, body map + triage alerts side panel |
| **Body map (SVG)** | Six clickable regions (Head/Eyes, Cardio, Respiratory, MSK, Skin/Immune, Behavioral) with Green/Yellow/Amber/Red glow |
| **Daily check-in** | Starts from the last check-in; 17 readings with input limits; “Fill from sensors” (simulated wearable sync); symptom flags + notes |
| **Triage engine** | Threshold bands → severity, hazard tags, plain-language “why,” Tier 1–3 actions |
| **Trends** | 7/30-day charts for HR, BP, SpO₂, sleep, mood, temp with green-band shading and anomaly callouts |
| **Guidance library** | Countermeasures, “why this exam,” five-hazards primer, ground-packet export |
| **Routines** | Wake / midday / pre-sleep checklist for the mission day |
| **Gamification** | XP, streaks, unlockable badges |
| **Profile** | Name, role, mission day, environment (spacecraft / station / rover / surface base) |
| **Offline PWA** | Installable app shell via service worker; all data stays in the browser |
| **Ground packet** | FHIR-lite JSON download for “uplink to flight surgeons” (demo stretch) |
| **Seed data** | Cmdr. Avery Chen, mission day 47, lunar surface base, ~30 days of history including a critical latest check-in |

### Screens (routes)

| Route | Screen |
| --- | --- |
| `/` | Dashboard + body map |
| `/checkin` | Daily check-in |
| `/trends` | Longitudinal charts |
| `/guidance` | Guidance & hazards |
| `/routines` | Mission routines + badges |
| `/profile` | Crew profile & environment |

---

## 3. How it works (high level)

```
Astronaut input
  (manual form / mock sensor sync / notes)
        │
        ▼
  Local store (Dexie / IndexedDB)
        │
        ▼
  Triage rules engine (TypeScript thresholds)
        │
        ├──► Severity colors on body-map regions
        ├──► Alert cards (hazard + why + Tier 1–3 actions)
        ├──► Trends over time
        └──► XP / streaks / badges + routine completion
```

### Core idea

1. **Capture** — Astronaut records indicators that matter in space (HR, BP, SpO₂, temp, glucose, sleep, mood, exercise).
2. **Evaluate** — Rules compare each value to demo threshold bands and assign Green / Yellow / Amber / Red.
3. **Explain** — Each non-green result is linked to one or more of NASA’s five hazards (radiation, isolation, distance, gravity, closed environment) with short “why this matters” copy.
4. **Act** — Suggested actions escalate by severity: self-care → consult CMO → queue ground packet for Earth.
5. **Stay autonomous** — Everything runs locally; no server required for the MVP demo.

### Color triage (at a glance)

| Color | Meaning |
| --- | --- |
| Green | Optimal / within band |
| Yellow | Caution — adjust lifestyle / recheck |
| Amber | Warning — CMO review soon |
| Red | Critical — emergency protocol + ground escalation |

### Body map

A flat SVG body diagram has six tappable regions. Region color = worst severity among that region’s indicators (plus symptom flags like rash or SANS visual changes). Tap a region → detail drawer with metrics, hazards, and alert cards.

### Data & tech (short)

- **UI:** React + TypeScript + Tailwind  
- **Body map:** hand-built SVG (no 3D library)  
- **Charts:** Recharts  
- **State:** Zustand  
- **Persistence:** Dexie (IndexedDB)  
- **Offline:** vite-plugin-pwa  

---

## 4. Challenge problems → our solution

| Challenge need | How AetherHealth answers it |
| --- | --- |
| Self-assess far from Earth | Offline PWA + local triage |
| Multiple spaceflight risks | Indicators mapped to five HRP hazards |
| Clear UI under stress | Body map + color coding |
| Guidance for non-experts | How-to-measure text + Tier actions |
| Sustained engagement | Routines + XP / badges |
| Multi-environment missions | Profile environment selector |

---

## 5. 30-second video — official script (from the team playbook)

The global demo video must be **30 seconds or less with English subtitles**. Record our own build at 1920×1080 after **Crew → Reset demo data**, and never press *Fill from sensors* on camera (it gives random values). No NASA logos; no AI-generated media unless watermarked "AI-generated".

| Time | On screen | Voiceover / subtitle |
| --- | --- | --- |
| 0:00–0:02 | Title card: team name, "Karachi" | "We're Team [name], from Karachi." |
| 0:02–0:05 | Dark screen: "Mars: up to 20 min from a doctor" | "On Mars, help from Earth can be twenty minutes away." |
| 0:05–0:10 | Analytics with the red **Critical: SpO₂ 88%** banner; title "AetherHealth" | "AetherHealth keeps astronauts medically independent, fully offline." |
| 0:10–0:20 | **Start guided protocol** (Tier 1→3 ladder); Risk tab "Why this color" showing the NASA-STD-3001 CO₂ source; radiation budget vs 600 mSv; live NASA DONKI space-weather card | "Log vitals, sleep and mood. It shows what's wrong, why, and what to do, built on NASA's five hazards, NASA-STD-3001 limits and live NASA space-weather data." |
| 0:20–0:27 | Early-warning line on a card; tap **Export to ground**, uplink queue shows transit time | "It catches slow declines early, then packages the data for flight surgeons." |
| 0:27–0:30 | End card: tagline, "Decision support, not diagnosis" | "Built for the Moon. Ready for Mars." |

Only mention the DONKI feed if it synced on the recording machine (the card shows "Last synced").

## 6. Quick demo path (if you need B-roll)

1. Land on Dashboard → show red critical banner if present.  
2. Tap body-map **Respiratory** / **Behavioral**.  
3. Open **Check-in** → “Sync mock sensors” (optional).  
4. Open **Trends** → Sleep 30 days.  
5. Open **Guidance** → Export ground packet.

---

## 7. Disclaimer (for captions if needed)

Educational Space Apps prototype. Thresholds are illustrative and not clinical or flight-surgeon protocol.

---

## Related docs

- Full project plan: [`AHMS-Project-Plan.md`](./AHMS-Project-Plan.md)  
- Challenge brief: [`../in md file of 10 pages.md`](../in%20md%20file%20of%2010%20pages.md)  
- Run instructions: [`../README.md`](../README.md)
