import type { HealthIndicatorId } from './types';

/**
 * Evidence behind every threshold: where it comes from, how strong it is,
 * and which NASA Human Research Program risk it monitors.
 * Shown in the Analytics Risk tab and the Guidance "Sources & method" section.
 */

export type SourceId =
  | 'nasa-hazards'
  | 'nasa-risks'
  | 'nasa-research'
  | 'csa-science'
  | 'csa-radiation'
  | 'nasa-std-3001'
  | 'msl-rad'
  | 'change4-lnd'
  | 'aasm-sleep'
  | 'acc-aha-bp'
  | 'ada-glucose'
  | 'who-oximetry'
  | 'ochmo-co2'
  | 'std-3001-v2'
  | 'ochmo-radiation'
  | 'ochmo-standards'
  | 'nasa-donki';

export interface Source {
  id: SourceId;
  org: string;
  title: string;
  /** Present only for links we have checked; papers and standards are cited by reference. */
  url?: string;
  /** What we use from it. */
  note: string;
}

export const SOURCES: Record<SourceId, Source> = {
  'nasa-hazards': {
    id: 'nasa-hazards',
    org: 'NASA Human Research Program',
    title: '5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
    note: 'The five hazards every indicator maps to, and that hazards "feed off one another".',
  },
  'nasa-risks': {
    id: 'nasa-risks',
    org: 'NASA Human Research Program',
    title: 'Risks of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/risks/',
    note: 'Names of the health risks each indicator monitors.',
  },
  'nasa-research': {
    id: 'nasa-research',
    org: 'NASA Human Research Program',
    title: 'Ongoing HRP Research',
    url: 'https://www.nasa.gov/hrp/ongoing-hrp-research/',
    note: 'Standard Measures (a consistent set of physiological and psychological measurements) and ARCHeR (well-being, activity and sleep on Artemis II) model the daily check-in.',
  },
  'csa-science': {
    id: 'csa-science',
    org: 'Canadian Space Agency',
    title: 'Why do we conduct science experiments in space?',
    url: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
    note: 'Deep-space risks (weightlessness, radiation, isolation, communication delay, less reliance on Earth for medical help).',
  },
  'csa-radiation': {
    id: 'csa-radiation',
    org: 'Canadian Space Agency',
    title: 'Monitoring radiation for astronaut health (2026)',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    note: 'Continuous, autonomous dose monitoring (CANS); neutrons are about 30% of total radiation on the ISS.',
  },
  'std-3001-v2': {
    id: 'std-3001-v2',
    org: 'NASA',
    title: 'NASA-STD-3001 Vol. 2, requirement V2 6004 (CO₂)',
    note: 'Average 1-hour CO₂ partial pressure in the habitable volume no more than 3 mmHg.',
  },
  'ochmo-co2': {
    id: 'ochmo-co2',
    org: 'NASA Office of the Chief Health & Medical Officer',
    title: 'OCHMO-TB-004 Carbon Dioxide technical brief',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf',
    note: '7-day average below 2.5 mmHg keeps ISS headache risk under 1%; headache, fatigue and malaise reported at 2.8–4.5 mmHg.',
  },
  'ochmo-radiation': {
    id: 'ochmo-radiation',
    org: 'NASA Office of the Chief Health & Medical Officer',
    title: 'Radiation Protection technical brief',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf',
    note: 'Career effective dose limit 600 mSv; 250 mSv limit per solar particle event.',
  },
  'ochmo-standards': {
    id: 'ochmo-standards',
    org: 'NASA Office of the Chief Health & Medical Officer',
    title: 'OCHMO standards overview (2021)',
    url: 'https://www.nasa.gov/sites/default/files/atoms/files/ochmo_standards_overview_sept_15_2021_francisco.pdf',
    note: 'Beyond LEO, habitats keep galactic cosmic-ray dose below 1.3 mSv/day in free space and 0.8 mSv/day on planetary surfaces.',
  },
  'nasa-donki': {
    id: 'nasa-donki',
    org: 'NASA Goddard CCMC, via api.nasa.gov',
    title: 'DONKI space weather database (solar flares, SEP events)',
    url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    note: 'Live solar flares and solar energetic particle events, fetched when online and cached for offline use.',
  },
  'nasa-std-3001': {
    id: 'nasa-std-3001',
    org: 'NASA',
    title: 'NASA-STD-3001 Vol. 1, Rev. B (2022), Crew Health',
    note: 'Career space-radiation limit of 600 mSv effective dose for every astronaut.',
  },
  'msl-rad': {
    id: 'msl-rad',
    org: 'Zeitlin et al., Science (2013)',
    title: 'Energetic particle radiation in transit to Mars (MSL RAD)',
    note: 'Measured ≈1.84 mSv/day in deep-space cruise.',
  },
  'change4-lnd': {
    id: 'change4-lnd',
    org: 'Zhang et al., Science Advances (2020)',
    title: 'First measurements of the radiation dose on the lunar surface (Chang’e-4 LND)',
    note: 'Measured ≈1.37 mSv/day on the lunar surface.',
  },
  'aasm-sleep': {
    id: 'aasm-sleep',
    org: 'AASM / Sleep Research Society consensus (2015)',
    title: 'Recommended amount of sleep for a healthy adult',
    note: 'Adults should sleep 7 or more hours per night.',
  },
  'acc-aha-bp': {
    id: 'acc-aha-bp',
    org: 'ACC/AHA guideline (2017)',
    title: 'High blood pressure in adults',
    note: 'Stage 1 hypertension starts at 130/80 mmHg; stage 2 at 140/90.',
  },
  'ada-glucose': {
    id: 'ada-glucose',
    org: 'American Diabetes Association, Standards of Care',
    title: 'Hypoglycemia classification',
    note: 'Level 1 hypoglycemia < 70 mg/dL; level 2 < 54 mg/dL. Hyperglycemia above 180 mg/dL.',
  },
  'who-oximetry': {
    id: 'who-oximetry',
    org: 'World Health Organization (2011)',
    title: 'Pulse Oximetry Training Manual',
    note: 'SpO₂ below 90% indicates hypoxaemia needing action.',
  },
};

export const SOURCE_LIST = Object.values(SOURCES);

/** How strong the threshold is, so judges and crews can see what is evidence vs. design choice. */
export type BasisKind = 'nasa-standard' | 'clinical' | 'spaceflight' | 'heuristic';

export const BASIS_LABEL: Record<BasisKind, string> = {
  'nasa-standard': 'NASA standard',
  clinical: 'Clinical guideline',
  spaceflight: 'Spaceflight data',
  heuristic: 'App heuristic',
};

/** NASA HRP risk names, exactly as written on nasa.gov/hrp/risks. */
export type NasaRisk =
  | 'Risk of Cardiovascular Adaptations'
  | 'Risk of Hypoxia'
  | 'Risk of Altered Immune System Responses'
  | 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness'
  | 'Risk of Spaceflight-Induced Bone Changes'
  | 'Risk of Inadequate Food and Nutrition'
  | 'Risk of Behavioral Changes and Psychiatric Disorders'
  | 'Risk of Inadequate Sleep and Irregular Schedules'
  | 'Risk of Radiation-Induced Cancers'
  | 'Risk of Inadequate Teamwork'
  | 'Risk of Altered Sensorimotor and Vestibular Function';

export interface IndicatorEvidence {
  basis: BasisKind;
  /** One or two sentences: why the bands sit where they do. */
  rationale: string;
  risks: NasaRisk[];
  sources: SourceId[];
}

export const EVIDENCE: Record<HealthIndicatorId, IndicatorEvidence> = {
  hr: {
    basis: 'clinical',
    rationale:
      'The usual adult resting range is 60–100 bpm. Green is set to 50–90 because fit crews often rest lower, and so a rising resting rate (deconditioning, stress) is flagged before it leaves the clinical range.',
    risks: ['Risk of Cardiovascular Adaptations', 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness'],
    sources: ['nasa-risks'],
  },
  bp_sys: {
    basis: 'clinical',
    rationale: 'Yellow starts above 130 mmHg, where ACC/AHA stage 1 hypertension begins; amber from 141 mmHg (stage 2). Low values flag orthostatic risk after gravity changes.',
    risks: ['Risk of Cardiovascular Adaptations'],
    sources: ['acc-aha-bp', 'nasa-risks'],
  },
  bp_dia: {
    basis: 'clinical',
    rationale: 'Follows the ACC/AHA diastolic cut-offs (stage 1 from 80, stage 2 from 90 mmHg), with green kept to 85 so a single reading does not alarm.',
    risks: ['Risk of Cardiovascular Adaptations'],
    sources: ['acc-aha-bp', 'nasa-risks'],
  },
  spo2: {
    basis: 'clinical',
    rationale: 'Healthy adults read 96–100%. Red at 89% and below matches the WHO hypoxaemia threshold (< 90%). NASA lists hypoxia as a deep-space risk around spacewalk preparation.',
    risks: ['Risk of Hypoxia'],
    sources: ['who-oximetry', 'nasa-risks'],
  },
  temp: {
    basis: 'clinical',
    rationale: 'Amber from 37.9 °C and red from 38.6 °C bracket the usual 38 °C fever threshold; red below 35 °C is clinical hypothermia. Fever can signal the immune changes and latent-virus reactivation NASA reports in flight.',
    risks: ['Risk of Altered Immune System Responses'],
    sources: ['nasa-risks'],
  },
  glucose: {
    basis: 'clinical',
    rationale: 'Uses the ADA levels: yellow below 70 mg/dL (level 1 hypoglycemia), red below 54 mg/dL (level 2), and amber above 180 mg/dL (hyperglycemia).',
    risks: ['Risk of Inadequate Food and Nutrition'],
    sources: ['ada-glucose', 'nasa-risks'],
  },
  sleep_h: {
    basis: 'clinical',
    rationale: 'Green is 7–9 h, the AASM/SRS adult recommendation. NASA tracks chronic sleep loss and irregular schedules as a crew risk.',
    risks: ['Risk of Inadequate Sleep and Irregular Schedules'],
    sources: ['aasm-sleep', 'nasa-risks', 'nasa-research'],
  },
  mood: {
    basis: 'heuristic',
    rationale: 'A 1–10 self-report screen, in the spirit of the psychological items in NASA Standard Measures. The cut-offs are app choices, not a validated clinical instrument.',
    risks: ['Risk of Behavioral Changes and Psychiatric Disorders'],
    sources: ['nasa-risks', 'nasa-research'],
  },
  stress: {
    basis: 'heuristic',
    rationale: 'A 1–10 self-report screen. NASA notes isolation, radiation and distance all strain crew mental health; the cut-offs are app choices, not a validated instrument.',
    risks: ['Risk of Behavioral Changes and Psychiatric Disorders'],
    sources: ['nasa-risks', 'nasa-research'],
  },
  fatigue: {
    basis: 'heuristic',
    rationale: 'A 1–10 self-report screen linked to sleep loss and workload. The cut-offs are app choices, not a validated instrument.',
    risks: ['Risk of Inadequate Sleep and Irregular Schedules', 'Risk of Behavioral Changes and Psychiatric Disorders'],
    sources: ['nasa-risks', 'nasa-research'],
  },
  exercise_min: {
    basis: 'heuristic',
    rationale: 'NASA says every astronaut exercises during the mission to counter bone, muscle and heart losses. Under 45 minutes in a day is flagged as a shortfall; the exact cut-off is an app choice.',
    risks: ['Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness', 'Risk of Spaceflight-Induced Bone Changes'],
    sources: ['nasa-risks'],
  },
  radiation_msv: {
    basis: 'nasa-standard',
    rationale:
      'Green ends at 0.8 mSv/day and yellow at 1.3 mSv/day, NASA’s design limits for cosmic-ray dose inside habitats on planetary surfaces and in free space. Unshielded background is higher (≈1.37 mSv/day on the Moon, ≈1.84 in deep space). Bands above 1.3 are illustrative; red suggests a solar particle event (250 mSv limit per event). Long-term risk is cumulative, so the mission total is tracked against the 600 mSv career limit.',
    risks: ['Risk of Radiation-Induced Cancers'],
    sources: ['ochmo-standards', 'ochmo-radiation', 'nasa-std-3001', 'nasa-donki', 'change4-lnd', 'msl-rad', 'csa-radiation', 'nasa-risks'],
  },
  teamwork: {
    basis: 'heuristic',
    rationale: 'A 1–10 self-report of crew cohesion. NASA studies how teams in prolonged isolation keep working well and recover from setbacks; these cut-offs are app choices, not a validated team instrument.',
    risks: ['Risk of Inadequate Teamwork'],
    sources: ['nasa-risks'],
  },
  dizziness: {
    basis: 'heuristic',
    rationale: 'A 0–10 symptom rating. NASA reports motion sickness, dizziness and coordination problems during gravity changes that make walking or vehicle operation hard; amber and red advise against vehicle operation. Cut-offs are app choices.',
    risks: ['Risk of Altered Sensorimotor and Vestibular Function'],
    sources: ['nasa-risks'],
  },
  resistive_min: {
    basis: 'heuristic',
    rationale: 'Bone breaks down without gravity, and NASA preserves bone strength through diet, exercise and medication. Under 30 minutes of bone-loading exercise in a day is flagged; the cut-off is an app choice.',
    risks: ['Risk of Spaceflight-Induced Bone Changes', 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness'],
    sources: ['nasa-risks'],
  },
  fluid_l: {
    basis: 'heuristic',
    rationale: 'Daily fluid intake as part of nutrition. Green is 2–5 L; the cut-offs are app choices pending dietitian / flight-surgeon review.',
    risks: ['Risk of Inadequate Food and Nutrition'],
    sources: ['nasa-risks'],
  },
  cabin_co2: {
    basis: 'nasa-standard',
    rationale:
      'Green ends at 2.5 mmHg (3,290 ppm), the 7-day level NASA’s CO₂ brief gives for under 1% headache risk; yellow ends at the NASA-STD-3001 limit of 3 mmHg (3,950 ppm, 1-hour average); amber covers 3–4.5 mmHg, where headache, fatigue and malaise are reported; red is above 4.5 mmHg. ppm assumes a 1-atmosphere cabin; NASA writes the limit in mmHg because habitats may run at lower pressure.',
    risks: [],
    sources: ['std-3001-v2', 'ochmo-co2', 'nasa-hazards'],
  },
};

/** Career space-radiation limit, NASA-STD-3001 Vol. 1 Rev. B (2022). */
export const CAREER_RADIATION_LIMIT_MSV = 600;

/**
 * Mission radiation budget. Check-ins log a daily dose estimate, so the mission
 * total is estimated as the average logged daily dose × mission days so far.
 */
export function radiationBudget(dailyDoses: number[], missionDay: number) {
  if (dailyDoses.length === 0 || missionDay <= 0) return null;
  const avgDaily = dailyDoses.reduce((a, b) => a + b, 0) / dailyDoses.length;
  const missionDose = avgDaily * missionDay;
  const pct = (missionDose / CAREER_RADIATION_LIMIT_MSV) * 100;
  const remaining = Math.max(0, CAREER_RADIATION_LIMIT_MSV - missionDose);
  const daysToLimit = avgDaily > 0 ? remaining / avgDaily : Infinity;
  return { avgDaily, missionDose, pct, remaining, daysToLimit, samples: dailyDoses.length };
}

/* ------------------------------------------------------------------ */
/* NASA HRP risk coverage                                              */
/* ------------------------------------------------------------------ */

export type RiskGroup = 'Human physiology' | 'Behavioral performance' | 'Space radiation';

export interface NasaRiskEntry {
  name: string;
  group: RiskGroup;
  /** Check-in symptom flags that also watch this risk. */
  flags?: string[];
  /** Why the app does not monitor it, when it doesn't. */
  gap?: string;
}

/** All 17 risks on nasa.gov/hrp/risks, in NASA's grouping and wording. */
export const NASA_RISKS: NasaRiskEntry[] = [
  { name: 'Risk of Altered Immune System Responses', group: 'Human physiology', flags: ['Skin rash'] },
  { name: 'Risk of Altered Sensorimotor and Vestibular Function', group: 'Human physiology', flags: ['Dizzy on standing'] },
  { name: 'Risk of Cardiovascular Adaptations', group: 'Human physiology', flags: ['Dizzy on standing'] },
  { name: 'Risk of Decompression Sickness', group: 'Human physiology', gap: 'Needs suit pressure and pre-breathe data from EVA systems.' },
  { name: 'Risk of Host-Microorganism Interactions', group: 'Human physiology', gap: 'Needs microbiome or environmental microbial sampling.' },
  { name: 'Risk of Hypoxia', group: 'Human physiology' },
  { name: 'Risk of Inadequate Food and Nutrition', group: 'Human physiology' },
  { name: 'Risk of Injury and Compromised Performance from Spacewalks', group: 'Human physiology', gap: 'Needs spacesuit telemetry (suit O₂, CO₂, workload).' },
  { name: 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness', group: 'Human physiology' },
  { name: 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)', group: 'Human physiology', flags: ['Changes in vision'] },
  { name: 'Risk of Spaceflight-Induced Bone Changes', group: 'Human physiology' },
  { name: 'Risk of Behavioral Changes and Psychiatric Disorders', group: 'Behavioral performance' },
  { name: 'Risk of Inadequate Teamwork', group: 'Behavioral performance' },
  { name: 'Risk of Inadequate Sleep and Irregular Schedules', group: 'Behavioral performance' },
  { name: 'Risk of Inadequate Systems Operations Support', group: 'Behavioral performance', gap: 'About vehicle and software support, not crew health readings.' },
  { name: 'Risk of Injury from Dynamic Loads', group: 'Behavioral performance', gap: 'Happens during landing; needs vehicle load sensors.' },
  { name: 'Risk of Radiation-Induced Cancers', group: 'Space radiation' },
];

/** Indicators (by id) whose evidence lists this risk. */
export function indicatorsForRisk(risk: string): HealthIndicatorId[] {
  return (Object.keys(EVIDENCE) as HealthIndicatorId[]).filter((id) => (EVIDENCE[id].risks as string[]).includes(risk));
}
