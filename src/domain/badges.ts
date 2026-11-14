import type { BadgeDefinition } from './types';

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_checkin',
    name: 'First Pulse',
    description: 'Completed your first daily health check-in.',
    icon: '◈',
  },
  {
    id: 'streak_3',
    name: 'Triple Orbit',
    description: 'Logged vitals three days in a row.',
    icon: '◷',
  },
  {
    id: 'streak_7',
    name: 'Week Underway',
    description: 'Seven-day logging streak.',
    icon: '✦',
  },
  {
    id: 'exercise_guardian',
    name: 'Load Bearer',
    description: 'Logged 45+ minutes of exercise in a check-in.',
    icon: '⬡',
  },
  {
    id: 'sleep_steward',
    name: 'Night Watch',
    description: 'Maintained green sleep hours.',
    icon: '☾',
  },
  {
    id: 'routine_complete',
    name: 'Full Circuit',
    description: 'Completed all routine tasks for a mission day.',
    icon: '◎',
  },
];
