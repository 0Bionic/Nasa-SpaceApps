import type { BodyRegionId, HazardId, HealthIndicatorId, Severity } from './types';

export interface ThresholdBand {
  severity: Severity;
  /** Inclusive min; omit for open lower bound */
  min?: number;
  /** Inclusive max; omit for open upper bound */
  max?: number;
}

export interface IndicatorDefinition {
  id: HealthIndicatorId;
  label: string;
  unit: string;
  description: string;
  howToMeasure: string;
  whyNeeded: string;
  hazards: HazardId[];
  regions: BodyRegionId[];
  /** Ordered from green → red; first matching band wins when evaluated by engine */
  bands: ThresholdBand[];
}

/**
 * Decimal places each indicator is recorded at. Bands are written at this
 * precision, so values are rounded to it before matching (no gaps between bands).
 */
export const INDICATOR_DECIMALS: Record<HealthIndicatorId, number> = {
  hr: 0,
  bp_sys: 0,
  bp_dia: 0,
  spo2: 0,
  temp: 1,
  glucose: 0,
  sleep_h: 1,
  mood: 0,
  exercise_min: 0,
  radiation_msv: 2,
  cabin_co2: 0,
  stress: 0,
  fatigue: 0,
  teamwork: 0,
  dizziness: 0,
  resistive_min: 0,
  fluid_l: 1,
};

/**
 * Thresholds and their evidence (clinical guideline, spaceflight data, or app
 * heuristic) are documented in ./evidence.ts. Not flight-surgeon protocol.
 */
export const INDICATORS: Record<HealthIndicatorId, IndicatorDefinition> = {
  hr: {
    id: 'hr',
    label: 'Heart rate',
    unit: 'bpm',
    description: 'Resting heart rate reflecting cardiovascular load and deconditioning.',
    howToMeasure: 'Sit quietly 2 minutes. Use a pulse oximeter, wearable, or count radial pulse for 60 seconds.',
    whyNeeded: 'Microgravity alters fluid distribution and cardiac workload; rising resting HR can signal deconditioning or stress.',
    hazards: ['gravity', 'closed_environment'],
    regions: ['cardio'],
    bands: [
      { severity: 'green', min: 50, max: 90 },
      { severity: 'yellow', min: 91, max: 100 },
      { severity: 'yellow', min: 45, max: 49 },
      { severity: 'amber', min: 101, max: 120 },
      { severity: 'amber', min: 40, max: 44 },
      { severity: 'red', min: 121 },
      { severity: 'red', max: 39 },
    ],
  },
  bp_sys: {
    id: 'bp_sys',
    label: 'Systolic BP',
    unit: 'mmHg',
    description: 'Peak arterial pressure during cardiac contraction.',
    howToMeasure: 'Use an automated cuff at heart level after 5 minutes seated rest. Record three readings if possible.',
    whyNeeded: 'Orthostatic and fluid shifts in altered gravity change blood pressure regulation.',
    hazards: ['gravity'],
    regions: ['cardio'],
    bands: [
      { severity: 'green', min: 100, max: 130 },
      { severity: 'yellow', min: 131, max: 140 },
      { severity: 'yellow', min: 90, max: 99 },
      { severity: 'amber', min: 141, max: 160 },
      { severity: 'amber', min: 80, max: 89 },
      { severity: 'red', min: 161 },
      { severity: 'red', max: 79 },
    ],
  },
  bp_dia: {
    id: 'bp_dia',
    label: 'Diastolic BP',
    unit: 'mmHg',
    description: 'Arterial pressure during cardiac relaxation.',
    howToMeasure: 'Captured with the same cuff reading as systolic BP.',
    whyNeeded: 'Tracks vascular tone changes and orthostatic risk alongside systolic values.',
    hazards: ['gravity'],
    regions: ['cardio'],
    bands: [
      { severity: 'green', min: 60, max: 85 },
      { severity: 'yellow', min: 86, max: 90 },
      { severity: 'yellow', min: 55, max: 59 },
      { severity: 'amber', min: 91, max: 100 },
      { severity: 'amber', min: 50, max: 54 },
      { severity: 'red', min: 101 },
      { severity: 'red', max: 49 },
    ],
  },
  spo2: {
    id: 'spo2',
    label: 'SpO₂',
    unit: '%',
    description: 'Peripheral oxygen saturation.',
    howToMeasure: 'Place pulse oximeter on a warm finger; wait for a stable reading.',
    whyNeeded: 'Closed cabin atmospheres and CO₂/O₂ imbalances can reduce oxygenation.',
    hazards: ['closed_environment'],
    regions: ['resp'],
    bands: [
      { severity: 'green', min: 96, max: 100 },
      { severity: 'yellow', min: 94, max: 95 },
      { severity: 'amber', min: 90, max: 93 },
      { severity: 'red', max: 89 },
    ],
  },
  temp: {
    id: 'temp',
    label: 'Core temperature',
    unit: '°C',
    description: 'Body temperature for infection and thermal stress screening.',
    howToMeasure: 'Use oral or tympanic thermometer; avoid measuring immediately after exercise.',
    whyNeeded: 'Immune shifts and cabin thermal excursions can present as fever or hypothermia.',
    hazards: ['closed_environment', 'radiation'],
    regions: ['skin_immune', 'head_eyes'],
    bands: [
      { severity: 'green', min: 36.1, max: 37.2 },
      { severity: 'yellow', min: 37.3, max: 37.8 },
      { severity: 'yellow', min: 35.5, max: 36.0 },
      { severity: 'amber', min: 37.9, max: 38.5 },
      { severity: 'amber', min: 35.0, max: 35.4 },
      { severity: 'red', min: 38.6 },
      { severity: 'red', max: 34.9 },
    ],
  },
  glucose: {
    id: 'glucose',
    label: 'Blood glucose',
    unit: 'mg/dL',
    description: 'Capillary blood sugar for metabolic monitoring.',
    howToMeasure: 'Fingerstick with onboard glucometer; note time since last meal.',
    whyNeeded: 'Stress, diet shifts, and countermeasure meds can destabilize glucose.',
    hazards: ['closed_environment', 'isolation'],
    regions: ['skin_immune'],
    bands: [
      { severity: 'green', min: 70, max: 140 },
      { severity: 'yellow', min: 141, max: 180 },
      { severity: 'yellow', min: 54, max: 69 },
      { severity: 'amber', min: 181, max: 250 },
      { severity: 'red', min: 251 },
      { severity: 'red', max: 53 },
    ],
  },
  sleep_h: {
    id: 'sleep_h',
    label: 'Sleep duration',
    unit: 'h',
    description: 'Hours of sleep in the prior rest period.',
    howToMeasure: 'Log sleep from lights-out to wake, or sync actigraphy wearable.',
    whyNeeded: 'Isolation, ops tempo, and light cycles fragment circadian rhythm.',
    hazards: ['isolation', 'distance'],
    regions: ['behavioral'],
    bands: [
      { severity: 'green', min: 7, max: 9 },
      { severity: 'yellow', min: 6, max: 6.9 },
      { severity: 'yellow', min: 9.1, max: 10 },
      { severity: 'amber', min: 4, max: 5.9 },
      { severity: 'amber', min: 10.1 },
      { severity: 'red', max: 3.9 },
    ],
  },
  mood: {
    id: 'mood',
    label: 'Mood score',
    unit: '/10',
    description: 'Subjective mood self-report (1 low – 10 high).',
    howToMeasure: 'Rate overall mood for the past 24 hours honestly; optional journal note.',
    whyNeeded: 'Behavioral health declines may precede performance or safety incidents.',
    hazards: ['isolation', 'distance'],
    regions: ['behavioral', 'head_eyes'],
    bands: [
      { severity: 'green', min: 7, max: 10 },
      { severity: 'yellow', min: 5, max: 6 },
      { severity: 'amber', min: 3, max: 4 },
      { severity: 'red', min: 1, max: 2 },
    ],
  },
  exercise_min: {
    id: 'exercise_min',
    label: 'Exercise',
    unit: 'min',
    description: 'Resistive or aerobic exercise minutes logged today (bone/muscle countermeasure proxy).',
    howToMeasure: 'Log completed ARED/cycle/ergometer session duration.',
    whyNeeded: 'Exercise is the primary countermeasure for bone density loss, muscle atrophy, and CV deconditioning.',
    hazards: ['gravity'],
    regions: ['msk', 'cardio'],
    bands: [
      { severity: 'green', min: 45 },
      { severity: 'yellow', min: 30, max: 44 },
      { severity: 'amber', min: 15, max: 29 },
      { severity: 'red', max: 14 },
    ],
  },
  radiation_msv: {
    id: 'radiation_msv',
    label: 'Radiation dose',
    unit: 'mSv/d',
    description: 'Daily ionizing radiation dose from onboard monitors. The mission total is tracked against the 600 mSv career limit.',
    howToMeasure: 'Enter the daily dose from onboard radiation monitors (or mission ops briefing).',
    whyNeeded:
      'Space radiation damages cells and raises long-term cancer and CNS risk; dose records support early attention.',
    hazards: ['radiation'],
    regions: ['skin_immune', 'head_eyes'],
    bands: [
      // NASA design limits for GCR dose (OCHMO standards overview): below 0.8 mSv/day on
      // planetary surfaces and 1.3 mSv/day in free space. Bands above 1.3 are illustrative.
      { severity: 'green', min: 0, max: 0.8 },
      { severity: 'yellow', min: 0.81, max: 1.3 },
      { severity: 'amber', min: 1.31, max: 10.0 },
      { severity: 'red', min: 10.01 },
    ],
  },
  cabin_co2: {
    id: 'cabin_co2',
    label: 'Cabin CO₂',
    unit: 'ppm',
    description: 'Habitat carbon dioxide level from ECLSS / portable monitor.',
    howToMeasure: 'Read cabin CO₂ from ECLSS display or handheld sensor; log as ppm.',
    whyNeeded:
      'Hostile closed environments with elevated CO₂ impair cognition, sleep, and respiratory comfort.',
    hazards: ['closed_environment'],
    regions: ['resp', 'behavioral'],
    bands: [
      // NASA-STD-3001 Vol 2 [V2 6004]: 1-hour average ppCO2 ≤ 3 mmHg. OCHMO-TB-004 / ISS data:
      // 7-day average < 2.5 mmHg keeps headache risk < 1%; headache, fatigue, malaise 2.8–4.5 mmHg.
      // ppm assumes a 1 atm (760 mmHg) cabin.
      { severity: 'green', min: 0, max: 3290 }, // ≤ 2.5 mmHg
      { severity: 'yellow', min: 3291, max: 3950 }, // ≤ 3.0 mmHg (standard limit)
      { severity: 'amber', min: 3951, max: 5920 }, // 3.0–4.5 mmHg
      { severity: 'red', min: 5921 }, // > 4.5 mmHg
    ],
  },
  stress: {
    id: 'stress',
    label: 'Stress',
    unit: '/10',
    description: 'Subjective stress / workload pressure (1 low – 10 high).',
    howToMeasure: 'Rate overall stress for the past 24 hours.',
    whyNeeded: 'Isolation, confinement, and ops tempo elevate stress before mood crashes show up.',
    hazards: ['isolation', 'distance'],
    regions: ['behavioral'],
    bands: [
      { severity: 'green', min: 1, max: 4 },
      { severity: 'yellow', min: 5, max: 6 },
      { severity: 'amber', min: 7, max: 8 },
      { severity: 'red', min: 9, max: 10 },
    ],
  },
  fatigue: {
    id: 'fatigue',
    label: 'Fatigue',
    unit: '/10',
    description: 'Subjective fatigue / exhaustion (1 low – 10 high).',
    howToMeasure: 'Rate how fatigued you feel right now.',
    whyNeeded: 'Fatigue and workload pressure (e.g. Skylab-era lessons) degrade performance and safety.',
    hazards: ['isolation', 'closed_environment'],
    regions: ['behavioral', 'msk'],
    bands: [
      { severity: 'green', min: 1, max: 4 },
      { severity: 'yellow', min: 5, max: 6 },
      { severity: 'amber', min: 7, max: 8 },
      { severity: 'red', min: 9, max: 10 },
    ],
  },
  teamwork: {
    id: 'teamwork',
    label: 'Crew cohesion',
    unit: '/10',
    description: 'How well the crew is working together today (1 poor – 10 excellent).',
    howToMeasure: 'Rate communication and cooperation with your crewmates over the past 24 hours.',
    whyNeeded: 'Long isolation and confinement strain teamwork; friction can precede errors and mood decline.',
    hazards: ['isolation', 'distance'],
    regions: ['behavioral'],
    bands: [
      { severity: 'green', min: 7, max: 10 },
      { severity: 'yellow', min: 5, max: 6 },
      { severity: 'amber', min: 3, max: 4 },
      { severity: 'red', min: 1, max: 2 },
    ],
  },
  dizziness: {
    id: 'dizziness',
    label: 'Dizziness / motion sickness',
    unit: '/10',
    description: 'Dizziness, vertigo, or motion sickness right now (0 none – 10 severe).',
    howToMeasure: 'Rate symptoms after moving your head and changing posture; note if worse after a gravity transition.',
    whyNeeded: 'Gravity transitions disturb the inner ear, causing motion sickness and poor coordination that affect walking and vehicle operation.',
    hazards: ['gravity'],
    regions: ['head_eyes'],
    bands: [
      { severity: 'green', min: 0, max: 2 },
      { severity: 'yellow', min: 3, max: 4 },
      { severity: 'amber', min: 5, max: 7 },
      { severity: 'red', min: 8, max: 10 },
    ],
  },
  resistive_min: {
    id: 'resistive_min',
    label: 'Resistive exercise',
    unit: 'min',
    description: 'Bone-loading resistive exercise minutes today (e.g. ARED squats, deadlifts).',
    howToMeasure: 'Log time spent on the resistive exercise device or load-bearing work.',
    whyNeeded: 'Without gravity, bones lose density; loading them is a primary countermeasure for bone loss.',
    hazards: ['gravity'],
    regions: ['msk'],
    bands: [
      { severity: 'green', min: 30 },
      { severity: 'yellow', min: 20, max: 29 },
      { severity: 'amber', min: 10, max: 19 },
      { severity: 'red', max: 9 },
    ],
  },
  fluid_l: {
    id: 'fluid_l',
    label: 'Fluid intake',
    unit: 'L',
    description: 'Total fluid intake today in litres.',
    howToMeasure: 'Sum water and drinks from your bottle log or dispenser counter.',
    whyNeeded: 'Fluid shifts in weightlessness and a low-thirst environment make under-hydration easy; it affects blood pressure, kidneys and performance.',
    hazards: ['gravity', 'closed_environment'],
    regions: ['cardio'],
    bands: [
      { severity: 'green', min: 2.0, max: 5.0 },
      { severity: 'yellow', min: 1.5, max: 1.9 },
      { severity: 'yellow', min: 5.1 },
      { severity: 'amber', min: 1.0, max: 1.4 },
      { severity: 'red', max: 0.9 },
    ],
  },
};

export const INDICATOR_LIST = Object.values(INDICATORS);
