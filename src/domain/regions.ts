import type { BodyRegionId, HazardId, HealthIndicatorId } from './types';

export interface BodyRegionDefinition {
  id: BodyRegionId;
  label: string;
  shortLabel: string;
  description: string;
  functionNote: string;
  indicators: HealthIndicatorId[];
  hazards: HazardId[];
  /** Approximate 3D hit-target position on stylized avatar */
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
    indicators: ['mood', 'temp'],
    hazards: ['gravity', 'radiation'],
    position: [0, 1.55, 0],
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
    position: [0, 1.05, 0.12],
  },
  resp: {
    id: 'resp',
    label: 'Respiratory',
    shortLabel: 'Lungs',
    description: 'Oxygenation and cabin atmosphere response.',
    functionNote:
      'Closed habitats require careful O₂/CO₂ balance; SpO₂ is a fast cabin-health proxy.',
    indicators: ['spo2'],
    hazards: ['closed_environment'],
    position: [0, 1.15, 0],
  },
  msk: {
    id: 'msk',
    label: 'Musculoskeletal',
    shortLabel: 'MSK',
    description: 'Bone loading and muscle countermeasure adherence.',
    functionNote:
      'Unload bones and muscles atrophy quickly without resistive exercise protocols.',
    indicators: ['exercise_min'],
    hazards: ['gravity'],
    position: [0, 0.45, 0],
  },
  skin_immune: {
    id: 'skin_immune',
    label: 'Skin & Immune',
    shortLabel: 'Immune',
    description: 'Temperature, glucose, and dermal/immune flags.',
    functionNote:
      'Spaceflight stressors reactivate latent viruses and alter immune surveillance.',
    indicators: ['temp', 'glucose'],
    hazards: ['radiation', 'closed_environment'],
    position: [0.35, 0.95, 0],
  },
  behavioral: {
    id: 'behavioral',
    label: 'Behavioral Health',
    shortLabel: 'Mind',
    description: 'Sleep and mood — isolation risk indicators.',
    functionNote:
      'Distance and confinement amplify sleep loss and mood decline; early detection protects crew performance.',
    indicators: ['sleep_h', 'mood'],
    hazards: ['isolation', 'distance'],
    position: [0, 1.7, 0],
  },
};

export const BODY_REGION_LIST = Object.values(BODY_REGIONS);
