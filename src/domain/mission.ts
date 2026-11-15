import { severityFor } from './triage/engine';
import { maxSeverity } from './types';
import type { CheckInInput, HazardId, MissionEnvironment, Severity } from './types';
import type { SourceId } from './evidence';

/* ------------------------------------------------------------------ */
/* Mission profiles                                                    */
/* ------------------------------------------------------------------ */

export interface MissionProfile {
  destination: string;
  gravity: string;
  /** One-way signal delay in seconds (worst case for transit). */
  delaySeconds: number;
  delayLabel: string;
  /** Measured daily background dose for comparison, when a measurement exists. */
  radiationBaseline: { msvPerDay: number; source: SourceId; label: string } | null;
  radiationNote: string;
  /** NASA habitat design limit for cosmic-ray dose (OCHMO standards overview). */
  designLimit: string;
  /** What changes for the crew at this destination. */
  focus: string;
}

/**
 * NASA notes risk effects "vary depending on whether humans are traveling to
 * low Earth orbit, the Moon, or Mars". Each habitat maps to one of those.
 */
export const MISSION_PROFILES: Record<MissionEnvironment, MissionProfile> = {
  station: {
    destination: 'Low Earth orbit',
    gravity: 'Microgravity',
    delaySeconds: 1,
    delayLabel: '< 1 s',
    radiationBaseline: null,
    designLimit: 'LEO limits apply',
    radiationNote: 'Earth’s magnetic field still blocks much of the radiation, so doses are lower than beyond orbit.',
    focus: 'Ground support is close: escalate early and use real-time flight-surgeon calls.',
  },
  surface_base: {
    destination: 'Lunar surface',
    gravity: '≈ 0.16 g',
    delaySeconds: 1.3,
    delayLabel: '1.3 s',
    radiationBaseline: { msvPerDay: 1.37, source: 'change4-lnd', label: 'Chang’e-4, lunar surface' },
    designLimit: '< 0.8 mSv/day',
    radiationNote: 'No magnetic field or atmosphere: background dose is several times higher than in orbit.',
    focus: 'Short delay but evacuation takes days: the CMO handles most issues on site.',
  },
  rover: {
    destination: 'Lunar surface (rover)',
    gravity: '≈ 0.16 g',
    delaySeconds: 1.3,
    delayLabel: '1.3 s',
    radiationBaseline: { msvPerDay: 1.37, source: 'change4-lnd', label: 'Chang’e-4, lunar surface' },
    designLimit: '< 0.8 mSv/day',
    radiationNote: 'Thinner shielding than a base; watch for solar particle events and return to shelter.',
    focus: 'Far from the base medical kit: monitor dizziness and fatigue before driving.',
  },
  spacecraft: {
    destination: 'Deep-space transit (Mars)',
    gravity: 'Microgravity',
    delaySeconds: 22 * 60,
    delayLabel: 'up to 22 min',
    radiationBaseline: { msvPerDay: 1.84, source: 'msl-rad', label: 'MSL RAD, cruise to Mars' },
    designLimit: '< 1.3 mSv/day',
    radiationNote: 'Highest sustained dose of any profile; the career budget matters most here.',
    focus: 'Earth cannot answer in time: the crew decides, and the ground packet waits for a comm window.',
  },
};

/* ------------------------------------------------------------------ */
/* Compounding hazards                                                 */
/* ------------------------------------------------------------------ */

export interface CompoundAlert {
  id: string;
  title: string;
  detail: string;
  hazards: HazardId[];
  severity: Severity;
  action: string;
}

const off = (s: Severity) => s !== 'green';

/**
 * NASA: the five hazards "do not stand alone. They can feed off one another
 * and exacerbate effects on the human body." These rules surface combinations
 * a single-reading check would miss. Severity is never raised above the worst
 * contributing reading; the rules are app heuristics.
 */
export function compoundAlerts(c: CheckInInput): CompoundAlert[] {
  const s = {
    co2: severityFor('cabin_co2', c.cabinCo2Ppm),
    sleep: severityFor('sleep_h', c.sleepH),
    mood: severityFor('mood', c.mood),
    stress: severityFor('stress', c.stress),
    fatigue: severityFor('fatigue', c.fatigue),
    team: severityFor('teamwork', c.teamwork),
    dizzy: severityFor('dizziness', c.dizziness),
    fluid: severityFor('fluid_l', c.fluidL),
    rad: severityFor('radiation_msv', c.radiationMsv),
    temp: severityFor('temp', c.temp),
    spo2: severityFor('spo2', c.spo2),
    resist: severityFor('resistive_min', c.resistiveMin),
  };
  const out: CompoundAlert[] = [];
  const worst = (...xs: Severity[]) => xs.reduce<Severity>((a, b) => maxSeverity(a, b), 'green');

  if (off(s.co2) && (off(s.sleep) || off(s.mood) || off(s.fatigue))) {
    out.push({
      id: 'co2-behaviour',
      title: 'Cabin air may be adding to poor sleep and mood',
      detail: 'Cabin CO₂ is above nominal while sleep, mood or fatigue is off. Elevated CO₂ impairs sleep and cognition, which feeds isolation stress.',
      hazards: ['closed_environment', 'isolation'],
      severity: worst(s.co2, s.sleep, s.mood, s.fatigue),
      action: 'Check CO₂ scrubbing first, then reassess sleep and mood after air quality recovers.',
    });
  }
  if (off(s.co2) && off(s.spo2)) {
    out.push({
      id: 'co2-hypoxia',
      title: 'Low oxygen with high CO₂',
      detail: 'SpO₂ is low while cabin CO₂ is high: the habitat atmosphere may be the common cause.',
      hazards: ['closed_environment'],
      severity: worst(s.co2, s.spo2),
      action: 'Treat as an environment problem: verify cabin O₂/CO₂ readouts, move to a ventilated module, recheck SpO₂.',
    });
  }
  if ((off(s.dizzy) || !!c.symptoms?.orthostaticDizziness) && off(s.fluid)) {
    out.push({
      id: 'fluid-dizziness',
      title: 'Low fluid intake may be worsening dizziness',
      detail: 'Dizziness after a gravity change is more likely when fluid intake is low, because blood volume shifts in weightlessness.',
      hazards: ['gravity', 'closed_environment'],
      severity: worst(s.dizzy, s.fluid, c.symptoms?.orthostaticDizziness ? 'yellow' : 'green'),
      action: 'Hydrate, sit for tasks, and hold off on driving or spacewalks until dizziness eases.',
    });
  }
  if (off(s.sleep) && (off(s.team) || off(s.stress))) {
    out.push({
      id: 'sleep-team',
      title: 'Sleep loss alongside crew strain',
      detail: 'Short sleep together with low cohesion or high stress is a known path to errors and conflict in isolated crews.',
      hazards: ['isolation', 'distance'],
      severity: worst(s.sleep, s.team, s.stress),
      action: 'Protect a rest block and hold a short crew debrief once rested.',
    });
  }
  if (off(s.rad) && (off(s.temp) || !!c.symptoms?.rash)) {
    out.push({
      id: 'radiation-immune',
      title: 'Elevated radiation with immune signs',
      detail: 'A raised dose with fever or a new rash is worth a CMO look: radiation and spaceflight stress both affect the immune system.',
      hazards: ['radiation', 'closed_environment'],
      severity: worst(s.rad, s.temp, c.symptoms?.rash ? 'yellow' : 'green'),
      action: 'Log the dose, confirm shelter status, and ask the CMO to examine.',
    });
  }
  if (off(s.resist) && off(s.fatigue)) {
    out.push({
      id: 'fatigue-bone',
      title: 'Missed bone-loading exercise while fatigued',
      detail: 'Fatigue is cutting into resistive exercise, the main countermeasure for bone loss in low gravity.',
      hazards: ['gravity'],
      severity: worst(s.resist, s.fatigue),
      action: 'Schedule a shorter resistive session after rest rather than skipping it.',
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* EVA / vehicle-operation readiness                                   */
/* ------------------------------------------------------------------ */

export type Readiness = 'go' | 'caution' | 'no-go';

/** Readings that matter before a spacewalk or driving a rover, with why. */
const READINESS_CHECKS: { id: Parameters<typeof severityFor>[0]; field: keyof CheckInInput; why: string }[] = [
  { id: 'spo2', field: 'spo2', why: 'oxygen saturation (hypoxia risk in the suit)' },
  { id: 'dizziness', field: 'dizziness', why: 'dizziness / motion sickness (coordination)' },
  { id: 'fatigue', field: 'fatigue', why: 'fatigue (attention and reaction time)' },
  { id: 'sleep_h', field: 'sleepH', why: 'sleep (alertness)' },
  { id: 'temp', field: 'temp', why: 'core temperature (possible illness)' },
  { id: 'hr', field: 'hr', why: 'heart rate (workload in the suit)' },
  { id: 'bp_sys', field: 'bpSys', why: 'blood pressure' },
];

/**
 * Go / caution / no-go for EVA or vehicle operations, from the latest check-in.
 * App heuristic (NASA lists spacewalk performance and sensorimotor function as
 * risks); a real decision is the flight surgeon's.
 */
export function evaReadiness(c: CheckInInput, spaceWeatherAlert = false) {
  const reasons: { level: Readiness; text: string }[] = [];
  for (const chk of READINESS_CHECKS) {
    const sev = severityFor(chk.id, c[chk.field] as number);
    if (sev === 'amber' || sev === 'red') reasons.push({ level: 'no-go', text: `Off-nominal ${chk.why}` });
    else if (sev === 'yellow') reasons.push({ level: 'caution', text: `Borderline ${chk.why}` });
  }
  if (c.symptoms?.orthostaticDizziness) reasons.push({ level: 'caution', text: 'Dizzy on standing reported' });
  if (spaceWeatherAlert) reasons.push({ level: 'no-go', text: 'Recent solar particle event or X-class flare (NASA DONKI)' });
  const status: Readiness = reasons.some((r) => r.level === 'no-go') ? 'no-go' : reasons.length ? 'caution' : 'go';
  return { status, reasons };
}
