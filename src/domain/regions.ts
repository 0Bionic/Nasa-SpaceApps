import type { BodyRegionId, HazardId, HealthIndicatorId } from './types';

export interface BodyRegionDefinition {
  id: BodyRegionId;
  label: string;
  shortLabel: string;
  description: string;
  functionNote: string;
  indicators: HealthIndicatorId[];
  hazards: HazardId[];
  /** Legacy 3D hotspot coords (unused by SVG BodyPlate; kept for domain stability) */
  position: [number, number, number];
}

export const BODY_REGIONS: Record<BodyRegionId, BodyRegionDefinition> = {
  head_eyes: {
    id: 'head_eyes',
    label: 'Head & Eyes',
    shortLabel: 'Head',
    description: 'Neurological comfort, vision, and SANS screening.',
    functionNote:
      'Fluid shifts toward the head in microgravity can raise intracranial and intraocular pressure, contributing to SANS.',
    indicators: ['mood', 'temp', 'radiation_msv'],
    hazards: ['gravity', 'radiation'],
    position: [0, 1.58, 0.16],
  },
  cardio: {
    id: 'cardio',
    label: 'Cardiovascular',
    shortLabel: 'Heart',
    description: 'Heart rate and blood pressure under altered gravity.',
    functionNote:
      'Without gravity-driven hydrostatic gradients, the heart remolds and orthostatic tolerance declines.',
    indicators: ['hr', 'bp_sys', 'bp_dia', 'exercise_min'],
    hazards: ['gravity', 'closed_environment'],
    position: [-0.07, 1.2, 0.14],
  },
  resp: {
    id: 'resp',
    label: 'Respiratory',
    shortLabel: 'Lungs',
    description: 'Oxygenation and cabin atmosphere response.',
    functionNote:
      'Closed habitats require careful O₂/CO₂ balance; SpO₂ and cabin CO₂ are paired habitat-health signals.',
    indicators: ['spo2', 'cabin_co2'],
    hazards: ['closed_environment'],
    position: [0.09, 1.26, 0.14],
  },
  msk: {
    id: 'msk',
    label: 'Musculoskeletal',
    shortLabel: 'MSK',
    description: 'Bone loading and muscle countermeasure adherence.',
    functionNote:
      'Unload bones and muscles atrophy quickly without resistive exercise protocols.',
    indicators: ['exercise_min', 'fatigue'],
    hazards: ['gravity'],
    position: [0, 0.55, 0.12],
  },
  skin_immune: {
    id: 'skin_immune',
    label: 'Skin & Immune',
    shortLabel: 'Immune',
    description: 'Temperature, glucose, radiation dose, and dermal/immune flags.',
    functionNote:
      'Spaceflight stressors and radiation reactivate latent viruses and alter immune surveillance.',
    indicators: ['temp', 'glucose', 'radiation_msv'],
    hazards: ['radiation', 'closed_environment'],
    position: [0.24, 1.05, 0.1],
  },
  behavioral: {
    id: 'behavioral',
    label: 'Behavioral Health',
    shortLabel: 'Mind',
    description: 'Sleep, mood, stress, and fatigue — isolation risk indicators.',
    functionNote:
      'Distance and confinement amplify sleep loss, stress, and mood decline; early detection protects crew performance.',
    indicators: ['sleep_h', 'mood', 'stress', 'fatigue'],
    hazards: ['isolation', 'distance'],
    position: [0, 1.82, 0],
  },
};

export const BODY_REGION_LIST = Object.values(BODY_REGIONS);
