# AetherHealth — Implementation Overview & 30-Second Video Guide

**Product:** AetherHealth  
**Challenge:** 2026 NASA Space Apps — Health Monitoring Software for Astronauts  
**Audience:** Team, judges, and anyone shooting the 30-second overview video

---

## 1. What we built (one paragraph)

AetherHealth is an **offline-first Progressive Web App** that lets astronauts log health indicators (vitals, sleep, mood, exercise), see status on an **interactive 3D body map**, understand **why** a result matters in the context of NASA’s five spaceflight hazards, and get **tiered next actions** (self-care → crew medical officer → ground packet). Seeded demo data makes a critical SpO₂ case visible immediately for demos and video.

---

## 2. What was implemented

| Area | What shipped |
| --- | --- |
| **Onboarding** | First-run overlay explaining autonomy when Earth is far away |
| **Dashboard** | Overall severity, critical banner, body map + triage alerts side panel |
| **3D body map** | Six clickable regions (Head/Eyes, Cardio, Respiratory, MSK, Skin/Immune, Behavioral) with Green/Yellow/Amber/Red glow |
| **Daily check-in** | Manual vitals form + “Sync mock sensors” + symptom flags + notes |
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
4. **Act** — Suggested actions escalate by severity: self-care → consult CMO → queue encrypted-style ground packet for Earth.
5. **Stay autonomous** — Everything runs locally; no server required for the MVP demo.

### Color triage (at a glance)

| Color | Meaning |
| --- | --- |
| Green | Optimal / within band |
| Yellow | Caution — adjust lifestyle / recheck |
| Amber | Warning — CMO review soon |
| Red | Critical — emergency protocol + ground escalation |

### Body map

A stylized 3D avatar has hotspot spheres. Region color = worst severity among that region’s indicators (plus symptom flags like rash or SANS visual changes). Tap a region → detail drawer with metrics, hazards, and alert cards.

### Data & tech (short)

- **UI:** React + TypeScript + Tailwind  
- **3D:** React Three Fiber  
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

## 5. 30-second video — overview script

**Goal:** One clear story: *offline self-assessment → color-coded body map → guided next actions.*

**Total runtime:** ~30 seconds  
**Tone:** Calm, mission-ops, confident — not medical hype  
**On-screen brand:** Keep **AetherHealth** visible in the header whenever possible

### Shot list + narration

| Time | What to show on screen | What to say |
| --- | --- | --- |
| **0–5s** | App open on Dashboard; logo “AetherHealth” in header; seed profile strip (mission day / surface base) | “AetherHealth helps astronauts monitor their own health when Earth is too far away.” |
| **5–14s** | Pan/orbit the **3D body map**; tap **Respiratory** (or show red/amber glow); open region detail briefly | “Crews log vitals, sleep, and mood — then see status on a color-coded body map linked to NASA’s spaceflight hazards.” |
| **14–22s** | Scroll or cut to an **alert card** showing Tier 1–3 actions; optional flash of **Check-in** or **Trends** | “When something’s off, the app explains why it matters and what to do next — from self-care to alerting ground.” |
| **22–30s** | Pull back to Dashboard overall status; optional click **Export ground packet** or show Routines/XP chip | “Fully offline. Mission-ready. AetherHealth — astronaut health, on their terms.” |

### Suggested voiceover (single take, ~75–85 words)

> AetherHealth helps astronauts monitor their own health when Earth is too far away.  
> Crews log vitals, sleep, and mood — then see status on a color-coded body map tied to NASA’s spaceflight hazards.  
> When something’s off, the app explains why it matters and guides the next step — from self-care to a ground packet for flight surgeons.  
> Fully offline. Mission-ready. AetherHealth.

### Recording tips

1. Run `npm run dev` in `~/NASA-SpaceApps` and use a wide browser window (tablet landscape feel).
2. Use the **seeded critical SpO₂** state on first load so the map already looks dramatic — no need to invent data live.
3. Prefer **cursor clicks** on body regions and one alert card; avoid racing through every tab.
4. Soft background music optional; keep narration louder than UI sounds.
5. End frame: Dashboard with AetherHealth logo + tagline *“Offline astronaut health monitoring.”*

### Optional on-screen text (lower thirds)

- `0s` — AetherHealth  
- `8s` — Color-coded body map  
- `16s` — Hazard-aware guidance  
- `25s` — Offline · Mission-ready  

---

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
