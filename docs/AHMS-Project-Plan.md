# AetherHealth — Astronaut Health Monitoring Software (AHMS)

## Project Plan & Implementation Guide

**Event:** 2026 NASA Space Apps Challenge  
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions  
**Difficulty:** Intermediate  
**Subjects:** Human Exploration · Software · Space Exploration  
**Product name:** AetherHealth  
**One-liner:** An offline-first astronaut self-assessment PWA that turns vitals, sleep, mood, and body-region status into color-coded triage, plain-language guidance, and mission routines.

---

## 1. Challenge Summary & Mission Context

Long-duration missions (Artemis lunar surface ops and future Mars transit) expose crews to NASA’s five hazards of human spaceflight: space radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments. Those hazards drive immune changes, bone and muscle loss, cardiovascular deconditioning, Spaceflight-Associated Neuro-ocular Syndrome (SANS), sleep disruption, and behavioral health strain.

In low Earth orbit, flight surgeons can monitor crews in near real time. Beyond LEO, communication delay (up to ~20 minutes one-way to Mars) and evacuation limits mean astronauts must assess and act on their own health. AetherHealth is designed as a visual, autonomous clinical decision-support tool that:

1. Gathers health indicators (manual entry, mock sensor sync, optional camera notes)
2. Evaluates status against mission-tuned thresholds
3. Explains *why* a result matters in the context of spaceflight hazards
4. Prescribes tiered actions (self-care → crew medical officer → ground packet)

The software runs fully offline on habitat or spacecraft tablets so distance from Earth never blocks a check-in.

---

## 2. Problem → Feature Matrix

| Challenge problem | Spaceflight hazard / risk | AetherHealth feature |
| --- | --- | --- |
| Crews must self-assess without real-time ground support | Distance from Earth | Offline-first PWA; local Dexie store; ground-packet export when a window opens |
| Radiation exposure and tissue risk | Space radiation | Radiation-linked education; immune/lymphocyte-oriented symptom prompts (demo) |
| Sleep loss, mood decline, crew friction | Isolation & confinement | Sleep hours + mood check-in; behavioral body region; sleep-hygiene guidance |
| Autonomy anxiety / incomplete exams | Distance from Earth | Guided check-ins; “why this exam” copy; completeness via routine checklist |
| Orthostatic issues, bone/muscle loss, SANS | Gravity fields | BP/HR tracking; MSK + head/eyes regions; exercise countermeasures |
| CO₂, infection, immune reactivation, thermal stress | Hostile / closed environments | Temp, SpO₂, rash/symptom flags; skin/immune region; cabin-aware environment profile |
| Unclear presentation of many metrics under stress | Cognitive load | Interactive body map; Green/Yellow/Amber/Red triage; plain-language alerts |
| Sustaining boring but critical health routines | Human factors | Routines/reminders; XP, streaks, badges |
| Different mission phases need different baselines | Multi-environment ops | Environment profile: spacecraft / station / rover / surface base |
| Astronauts may not know how to measure or interpret | Education gap | Onboarding; measurement instructions; hazard explainers on every alert |

---

## 3. User Journeys

### 3.1 Daily check-in (primary path)

1. Astronaut opens AetherHealth (installed PWA, offline).
2. Dashboard shows overall status color + mission day + XP streak.
3. Routine prompt: “Wake vitals due.”
4. Check-in form: HR, BP, SpO₂, temp, glucose, sleep, mood, optional symptoms.
5. Optional “Sync wearables” fills demo values from mock sensors.
6. Save → triage engine scores each indicator → body map regions update colors.
7. If any Yellow+: alert cards list hazard links + Tier 1 actions.
8. XP awarded; streak increments; badge unlock if criteria met.

### 3.2 Critical alert path

1. Red threshold breach (e.g., SpO₂ critically low, high fever).
2. Pulsing red on affected body region + audio-visual alert banner.
3. Guidance shows Tier 2 (consult CMO) and Tier 3 (queue ground packet).
4. Astronaut can export encrypted JSON/FHIR-lite bundle for later uplink.

### 3.3 Weekly review path

1. Open Trends (7 / 30 day).
2. Charts for HR, BP, sleep, mood with threshold bands.
3. Anomaly callouts where values leave green band for ≥3 days.
4. Guidance library suggests preventive countermeasures (exercise, Vit D, sleep hygiene).

---

## 4. Feature Specifications

### 4.1 Must-have (MVP)

| ID | Feature | Description | Acceptance criteria |
| --- | --- | --- | --- |
| F1 | Crew profile & environment | Name, role, mission day, environment | Profile persists locally; environment selectable |
| F2 | Daily check-in | Manual vitals + mood + sleep + notes | All core fields save; validation on ranges |
| F3 | Interactive body map | Clickable regions with status colors | Six regions; click opens detail drawer |
| F4 | Color-coded triage | G / Y / A / R per indicator and region | Seed data shows at least one non-green |
| F5 | Explainability | Hazard link + why + next actions | Every non-green result has Tier 1–3 actions |
| F6 | Trend charts | 7/30 day for key metrics | Charts render from seed + new entries |
| F7 | Routine prompts | Wake vitals, exercise, pre-sleep mood | Checklist completable; state persisted |
| F8 | Gamification | XP, streaks, badges | Completing check-in awards XP |
| F9 | Guidance library | Hydration, exercise, nutrition, sleep, escalate | Content reachable from alerts and Guidance page |
| F10 | Offline PWA | Installable; works without network | Service worker caches app shell; demo works offline |

### 4.2 Stretch

- FHIR-lite ground packet export
- Ultrasound / image attach on a body region
- Multi-profile crew leaderboard (local)
- Cabin CO₂ / radiation mock telemetry panel
- High-contrast cockpit mission theme toggle

### 4.3 Out of scope

- Real Bluetooth medical device pairing / FDA claims
- Diagnostic ML / clinical diagnosis guarantees
- Live NASA telemetry
- Server-backed multiplayer

---

## 5. Architecture & Data Model

### 5.1 Stack

| Layer | Choice |
| --- | --- |
| App type | Progressive Web App (tablet-first) |
| UI | Vite + React 18 + TypeScript + Tailwind CSS |
| 3D body map | React Three Fiber + drei |
| Charts | Recharts |
| Client state | Zustand |
| Persistence | Dexie (IndexedDB) |
| Sensitive fields | Web Crypto AES-GCM (at rest for notes/export) |
| Triage | Pure TypeScript rules in `src/domain/triage/` |
| Deploy | Static hosting (Vercel / GitHub Pages) |

### 5.2 Data flow

```
Manual entry / Mock sensor / Camera stub
        → Dexie repositories
        → TriageRulesEngine
        → CountermeasureEngine
        → Dashboard + BodyMap + Trends + Routines/XP
```

### 5.3 Core types (contract)

```ts
type Severity = 'green' | 'yellow' | 'amber' | 'red';
type HazardId =
  | 'radiation'
  | 'isolation'
  | 'distance'
  | 'gravity'
  | 'closed_environment';
type HealthIndicatorId =
  | 'hr' | 'bp_sys' | 'bp_dia' | 'spo2' | 'temp'
  | 'glucose' | 'sleep_h' | 'mood' | 'exercise_min';
type BodyRegionId =
  | 'head_eyes' | 'cardio' | 'resp' | 'msk' | 'skin_immune' | 'behavioral';

interface TriageResult {
  indicatorId: HealthIndicatorId;
  severity: Severity;
  hazards: HazardId[];
  summary: string;
  actions: CountermeasureAction[];
}
```

### 5.4 Persistence tables

- `profiles` — crew identity, environment, missionDay, xp, streak
- `checkIns` — timestamped vitals + symptoms + notes
- `routines` — checklist item completion by mission day
- `badges` — unlocked achievement ids
- `attachments` — optional image blobs keyed by region (stretch)

### 5.5 Repo layout

```
/
  docs/AHMS-Project-Plan.md
  README.md
  package.json
  src/
    app/              # routes, layout, PWA shell
    domain/           # indicators, hazards, triage, countermeasures
    data/             # Dexie schema, seed, repositories
    features/
      checkin/
      bodymap/
      trends/
      guidance/
      routines/
      gamification/
      profile/
    components/
    styles/
  public/
```

---

## 6. UI / UX Principles

1. **One composition dashboard** — status, body map, and primary CTA; not a dense ops dashboard of unrelated cards in the first view.
2. **Brand-first** — “AetherHealth” is the hero signal on onboarding and header.
3. **Cognitive load** — color triage before numbers; numbers on demand in drawers.
4. **Body map as visual metaphor** — tap region → localized metrics, hazards, actions.
5. **Severity tokens**
   - Green — Optimal
   - Yellow — Caution / lifestyle adjust
   - Amber — Warning / CMO review soon
   - Red — Critical / emergency protocol
6. **Mission visual language** — deep space navy, teal accents, high-contrast status colors; avoid generic purple gradients.
7. **Motion with purpose** — region focus tween; critical pulse; chart draw-in.
8. **Tablet-first** — large tap targets; landscape-friendly split (map | detail).

---

## 7. Four-Developer Ownership

| Dev | Role | Owns | Delivers |
| --- | --- | --- | --- |
| **A** | Domain / data lead | `src/domain/**`, `src/data/**` | Models, thresholds, triage, Dexie, seed, countermeasures, export |
| **B** | App shell / input | `src/app/**`, checkin, routines, gamification, profile | Routing, PWA, forms, mock sync, XP/streaks |
| **C** | Visualization | `src/features/bodymap/**`, status tokens | R3F body map, region drawer, color system, motion |
| **D** | Insights / polish | trends, guidance, onboarding, README demo | Charts, guidance UI, education copy, a11y, demo script |

**Day-0 rule:** Dev A publishes types; B/C/D import only from `src/domain` and repository APIs — no duplicate threshold logic in UI.

---

## 8. Phases & Definition of Done

### Phase 0 — Kickoff
- Scaffold + plan doc + design tokens + frozen indicator list

### Phase 1 — Vertical slice
- Enter vitals → persist → triage → dashboard + one region color update

### Phase 2 — Core MVP
- All F1–F10 features with seed history

### Phase 3 — Demo harden
- Offline verify, empty/critical states, 3-minute judge script

### Definition of done (hackathon)
- [ ] Offline check-in changes body-map color
- [ ] Yellow and Red paths show explanation + actions
- [ ] Trends show seed history
- [ ] Story is clear: hazards → indicators → triage → countermeasures → autonomy

---

## 9. Demo Script (≈3 minutes)

1. **Hook (20s):** “On Mars, Earth is 20 minutes away. AetherHealth keeps the crew medically autonomous.”
2. **Dashboard (30s):** Show seed astronaut on lunar base; mixed green/yellow body map.
3. **Check-in (45s):** Enter low SpO₂ or poor sleep; save; watch region turn amber/red.
4. **Explain (40s):** Open alert — hazard chips, why it matters, Tier 1–3 actions.
5. **Trends (25s):** 30-day sleep/mood decline tied to isolation.
6. **Close (20s):** Routines + XP keep adherence up; export ground packet for when the pass opens.

---

## 10. References

- NASA Human Research Program — Five Hazards of Human Spaceflight
- NASA HRP risks: immune, cardiovascular, bone/muscle, SANS, behavioral health, sleep
- Canadian Space Agency — ISS science & radiation monitoring research (CANS)
- NASA Open Data & Space Apps Challenge guidelines
- Project source brief: `in md file of 10 pages.md`

---

## Appendix A — MVP Indicator Thresholds (illustrative)

| Indicator | Green | Yellow | Amber | Red |
| --- | --- | --- | --- | --- |
| HR (bpm) | 50–90 | 91–100 or 45–49 | 101–120 or 40–44 | >120 or <40 |
| BP sys (mmHg) | 100–130 | 131–140 or 90–99 | 141–160 or 80–89 | >160 or <80 |
| BP dia (mmHg) | 60–85 | 86–90 or 55–59 | 91–100 or 50–54 | >100 or <50 |
| SpO₂ (%) | ≥96 | 94–95 | 90–93 | <90 |
| Temp (°C) | 36.1–37.2 | 37.3–37.8 or 35.5–36.0 | 37.9–38.5 or 35.0–35.4 | >38.5 or <35.0 |
| Glucose (mg/dL) | 70–140 | 141–180 or 60–69 | 181–250 or 50–59 | >250 or <50 |
| Sleep (h) | 6.5–9 | 5.5–6.4 or 9–10 | 4–5.4 | <4 |
| Mood (1–10) | 7–10 | 5–6 | 3–4 | 1–2 |

Thresholds are educational/demo defaults inspired by terrestrial clinical ranges and spaceflight risk framing — not flight-surgeon protocol.

## Appendix B — Body Region Mapping

| Region | Primary indicators | Primary hazards |
| --- | --- | --- |
| Head / Eyes | mood symptoms, SANS flags, temp | Gravity, Radiation |
| Cardio | HR, BP | Gravity, Closed env. |
| Respiratory | SpO₂ | Closed env. |
| Musculoskeletal | exercise_min, orthostatic symptoms | Gravity |
| Skin / Immune | temp, rash flag | Radiation, Closed env. |
| Behavioral | sleep_h, mood | Isolation, Distance |
