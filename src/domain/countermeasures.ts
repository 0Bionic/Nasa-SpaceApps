import type { CountermeasureAction, HealthIndicatorId, Severity } from './types';

const ACTIONS: Record<string, CountermeasureAction> = {
  hydrate: {
    id: 'hydrate',
    tier: 1,
    title: 'Hydration protocol',
    description: 'Drink 250–500 mL fluid now; continue scheduled intake. Log urine color if available.',
    category: 'hydration',
  },
  rest_block: {
    id: 'rest_block',
    tier: 1,
    title: 'Protected rest block',
    description: 'Schedule a 30–60 minute protected rest or nap; dim cabin lighting if ops allow.',
    category: 'sleep',
  },
  sleep_hygiene: {
    id: 'sleep_hygiene',
    tier: 1,
    title: 'Sleep hygiene reset',
    description: 'Fixed lights-out, no caffeine after mid-day ops, eye mask / earplugs, wind-down checklist.',
    category: 'sleep',
  },
  mood_check: {
    id: 'mood_check',
    tier: 1,
    title: 'Behavioral self-check',
    description: 'Complete a 5-minute mood journal and private check-in with a trusted crewmate.',
    category: 'monitor',
  },
  resistive_ex: {
    id: 'resistive_ex',
    tier: 1,
    title: 'Resistive exercise session',
    description: 'Complete prescribed ARED/resistive protocol focusing on lower limb and spinal loading.',
    category: 'exercise',
  },
  cycle_ex: {
    id: 'cycle_ex',
    tier: 1,
    title: 'Aerobic cycle session',
    description: '30–45 minutes cycle ergometry at prescribed HR zone to support cardiovascular fitness.',
    category: 'exercise',
  },
  vit_d: {
    id: 'vit_d',
    tier: 1,
    title: 'Bone-preserving nutrition',
    description: 'Confirm vitamin D and calcium intake per mission nutrition plan; avoid skipping meals.',
    category: 'nutrition',
  },
  glucose_snack: {
    id: 'glucose_snack',
    tier: 1,
    title: 'Glucose self-care',
    description: 'If low: take approved carbohydrate. If high: hydrate, note last meal, recheck in 30–60 min.',
    category: 'nutrition',
  },
  recheck_vitals: {
    id: 'recheck_vitals',
    tier: 1,
    title: 'Recheck in 15–30 min',
    description: 'Repeat measurement after rest; confirm sensor placement and cabin conditions.',
    category: 'monitor',
  },
  o2_cabin: {
    id: 'o2_cabin',
    tier: 1,
    title: 'Verify cabin atmosphere',
    description: 'Check O₂/CO₂ displays with ECLSS; move to a well-ventilated module if SpO₂ is low.',
    category: 'monitor',
  },
  cmo_exam: {
    id: 'cmo_exam',
    tier: 2,
    title: 'Consult Crew Medical Officer',
    description: 'Schedule CMO exam using onboard diagnostic kit (vitals, focused physical, symptom review).',
    category: 'escalate',
  },
  sans_screen: {
    id: 'sans_screen',
    tier: 2,
    title: 'SANS / ocular screen',
    description: 'Perform vision acuity check and document visual changes for CMO review.',
    category: 'escalate',
  },
  ground_packet: {
    id: 'ground_packet',
    tier: 3,
    title: 'Queue ground surgeon packet',
    description: 'Export encrypted vitals bundle for uplink to flight surgeons at the next comm window.',
    category: 'escalate',
  },
  emergency_protocol: {
    id: 'emergency_protocol',
    tier: 3,
    title: 'Execute emergency medical protocol',
    description: 'Follow onboard emergency checklist immediately; notify CMO and prepare ground alert.',
    category: 'escalate',
  },
  radiation_shelter: {
    id: 'radiation_shelter',
    tier: 1,
    title: 'Radiation shelter / dose log',
    description:
      'Confirm shelter status if solar event; log dose, limit EVA, and review cumulative exposure with CMO.',
    category: 'monitor',
  },
  co2_scrub: {
    id: 'co2_scrub',
    tier: 1,
    title: 'ECLSS / CO₂ response',
    description: 'Verify CO₂ scrubbers, relocate to a lower-CO₂ module if available, and recheck SpO₂.',
    category: 'monitor',
  },
  team_debrief: {
    id: 'team_debrief',
    tier: 1,
    title: 'Crew debrief',
    description: 'Hold a short structured debrief: what is working, one friction point, one agreed change. Rotate who leads.',
    category: 'monitor',
  },
  vestibular_care: {
    id: 'vestibular_care',
    tier: 1,
    title: 'Vestibular precautions',
    description: 'Limit fast head movement, keep a fixed visual reference, sit for tasks, and do not operate vehicles or start an EVA until symptoms ease.',
    category: 'monitor',
  },
  stress_break: {
    id: 'stress_break',
    tier: 1,
    title: 'Workload / stress break',
    description:
      'Take a protected 20-minute break, use a breathing reset, and defer non-critical tasks if ops allow.',
    category: 'monitor',
  },
};

const BY_INDICATOR: Record<HealthIndicatorId, Partial<Record<Severity, string[]>>> = {
  hr: {
    yellow: ['recheck_vitals', 'hydrate', 'cycle_ex'],
    amber: ['recheck_vitals', 'cmo_exam', 'cycle_ex'],
    red: ['emergency_protocol', 'cmo_exam', 'ground_packet'],
  },
  bp_sys: {
    yellow: ['hydrate', 'recheck_vitals', 'resistive_ex'],
    amber: ['cmo_exam', 'hydrate', 'recheck_vitals'],
    red: ['emergency_protocol', 'cmo_exam', 'ground_packet'],
  },
  bp_dia: {
    yellow: ['hydrate', 'recheck_vitals'],
    amber: ['cmo_exam', 'hydrate'],
    red: ['emergency_protocol', 'cmo_exam', 'ground_packet'],
  },
  spo2: {
    yellow: ['o2_cabin', 'recheck_vitals'],
    amber: ['o2_cabin', 'cmo_exam', 'recheck_vitals'],
    red: ['emergency_protocol', 'o2_cabin', 'ground_packet'],
  },
  temp: {
    yellow: ['recheck_vitals', 'hydrate'],
    amber: ['cmo_exam', 'recheck_vitals', 'hydrate'],
    red: ['emergency_protocol', 'cmo_exam', 'ground_packet'],
  },
  glucose: {
    yellow: ['glucose_snack', 'recheck_vitals'],
    amber: ['glucose_snack', 'cmo_exam'],
    red: ['emergency_protocol', 'cmo_exam', 'ground_packet'],
  },
  sleep_h: {
    yellow: ['sleep_hygiene', 'rest_block'],
    amber: ['sleep_hygiene', 'rest_block', 'cmo_exam'],
    red: ['cmo_exam', 'sleep_hygiene', 'ground_packet'],
  },
  mood: {
    yellow: ['mood_check', 'sleep_hygiene'],
    amber: ['mood_check', 'cmo_exam', 'rest_block'],
    red: ['cmo_exam', 'ground_packet', 'mood_check'],
  },
  exercise_min: {
    yellow: ['resistive_ex', 'vit_d'],
    amber: ['resistive_ex', 'cycle_ex', 'vit_d'],
    red: ['resistive_ex', 'cmo_exam', 'vit_d'],
  },
  radiation_msv: {
    yellow: ['radiation_shelter', 'recheck_vitals'],
    amber: ['radiation_shelter', 'cmo_exam', 'ground_packet'],
    red: ['emergency_protocol', 'radiation_shelter', 'ground_packet'],
  },
  cabin_co2: {
    yellow: ['co2_scrub', 'o2_cabin', 'recheck_vitals'],
    amber: ['co2_scrub', 'cmo_exam', 'o2_cabin'],
    red: ['emergency_protocol', 'co2_scrub', 'ground_packet'],
  },
  stress: {
    yellow: ['stress_break', 'mood_check'],
    amber: ['stress_break', 'mood_check', 'cmo_exam'],
    red: ['cmo_exam', 'ground_packet', 'stress_break'],
  },
  fatigue: {
    yellow: ['rest_block', 'sleep_hygiene'],
    amber: ['rest_block', 'cmo_exam', 'sleep_hygiene'],
    red: ['cmo_exam', 'ground_packet', 'rest_block'],
  },
  teamwork: {
    yellow: ['team_debrief', 'mood_check'],
    amber: ['team_debrief', 'cmo_exam', 'stress_break'],
    red: ['cmo_exam', 'ground_packet', 'team_debrief'],
  },
  dizziness: {
    yellow: ['vestibular_care', 'hydrate'],
    amber: ['vestibular_care', 'cmo_exam', 'recheck_vitals'],
    red: ['vestibular_care', 'cmo_exam', 'ground_packet'],
  },
  resistive_min: {
    yellow: ['resistive_ex', 'vit_d'],
    amber: ['resistive_ex', 'vit_d'],
    red: ['resistive_ex', 'cmo_exam', 'vit_d'],
  },
  fluid_l: {
    yellow: ['hydrate'],
    amber: ['hydrate', 'recheck_vitals'],
    red: ['hydrate', 'cmo_exam', 'recheck_vitals'],
  },
};

export function actionsFor(indicatorId: HealthIndicatorId, severity: Severity): CountermeasureAction[] {
  if (severity === 'green') return [];
  const ids = BY_INDICATOR[indicatorId][severity] ?? ['recheck_vitals', 'cmo_exam'];
  return ids.map((id) => ACTIONS[id]);
}

export const GUIDANCE_LIBRARY: CountermeasureAction[] = [
  ACTIONS.hydrate,
  ACTIONS.resistive_ex,
  ACTIONS.cycle_ex,
  ACTIONS.vit_d,
  ACTIONS.sleep_hygiene,
  ACTIONS.rest_block,
  ACTIONS.mood_check,
  ACTIONS.stress_break,
  ACTIONS.team_debrief,
  ACTIONS.vestibular_care,
  ACTIONS.glucose_snack,
  ACTIONS.o2_cabin,
  ACTIONS.co2_scrub,
  ACTIONS.radiation_shelter,
  ACTIONS.cmo_exam,
  ACTIONS.sans_screen,
  ACTIONS.ground_packet,
];

export { ACTIONS };
