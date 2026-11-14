import type { HazardId } from './types';

export interface HazardInfo {
  id: HazardId;
  name: string;
  shortName: string;
  description: string;
  clinicalImpact: string;
}

export const HAZARDS: Record<HazardId, HazardInfo> = {
  radiation: {
    id: 'radiation',
    name: 'Space Radiation',
    shortName: 'Radiation',
    description:
      'Galactic cosmic rays and solar particle events deliver cumulative tissue dose that Earth magnetic shielding normally blocks.',
    clinicalImpact:
      'Elevated cancer risk, CNS effects, immune dysregulation, and acute radiation sickness during extreme solar events.',
  },
  isolation: {
    id: 'isolation',
    name: 'Isolation & Confinement',
    shortName: 'Isolation',
    description:
      'Long confinement in a small habitat far from home stressors circadian rhythm, mood, and crew interpersonal dynamics.',
    clinicalImpact:
      'Sleep fragmentation, depression risk, cognitive fatigue, and teamwork friction.',
  },
  distance: {
    id: 'distance',
    name: 'Distance from Earth',
    shortName: 'Distance',
    description:
      'Communication delay (up to ~20 minutes one-way to Mars) removes real-time flight-surgeon support and evacuation options.',
    clinicalImpact:
      'Autonomy burden, incomplete exams without onboard guidance, delayed escalation to ground.',
  },
  gravity: {
    id: 'gravity',
    name: 'Gravity Fields',
    shortName: 'Gravity',
    description:
      'Transitions across 1g, microgravity, lunar (~0.16g), and Martian (~0.38g) disrupt fluids, bone loading, and vestibular function.',
    clinicalImpact:
      'Orthostatic intolerance, bone/muscle loss, SANS, and sensorimotor issues.',
  },
  closed_environment: {
    id: 'closed_environment',
    name: 'Hostile / Closed Environments',
    shortName: 'Closed Env.',
    description:
      'Cabin atmosphere, CO₂ scrubbing, microbes, acoustics, and thermal control form a tightly coupled closed ecosystem.',
    clinicalImpact:
      'Hypoxia risk, rashes, latent virus reactivation, immune shifts, and chronic fatigue.',
  },
};

export const HAZARD_LIST = Object.values(HAZARDS);
