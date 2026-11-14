import type { RoutineItem } from '@/domain/types';

export const ROUTINE_CATALOG: RoutineItem[] = [
  {
    id: 'wake_vitals',
    label: 'Wake vitals',
    description: 'Log HR, BP, SpO₂, temperature after waking.',
    schedule: 'wake',
  },
  {
    id: 'exercise_block',
    label: 'Exercise countermeasure',
    description: 'Complete prescribed resistive or aerobic session.',
    schedule: 'midday',
  },
  {
    id: 'hydration_mid',
    label: 'Hydration check',
    description: 'Confirm fluid intake is on track for the mission day.',
    schedule: 'midday',
  },
  {
    id: 'presleep_mood',
    label: 'Pre-sleep mood & sleep plan',
    description: 'Score mood and set lights-out intention.',
    schedule: 'pre_sleep',
  },
];
