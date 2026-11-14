export type Severity = 'green' | 'yellow' | 'amber' | 'red';

export type HazardId =
  | 'radiation'
  | 'isolation'
  | 'distance'
  | 'gravity'
  | 'closed_environment';

export type HealthIndicatorId =
  | 'hr'
  | 'bp_sys'
  | 'bp_dia'
  | 'spo2'
  | 'temp'
  | 'glucose'
  | 'sleep_h'
  | 'mood'
  | 'exercise_min'
  | 'radiation_msv'
  | 'cabin_co2'
  | 'stress'
  | 'fatigue';

export type BodyRegionId =
  | 'head_eyes'
  | 'cardio'
  | 'resp'
  | 'msk'
  | 'skin_immune'
  | 'behavioral';

export type MissionEnvironment =
  | 'spacecraft'
  | 'station'
  | 'rover'
  | 'surface_base';

export type ActionTier = 1 | 2 | 3;

export interface CountermeasureAction {
  id: string;
  tier: ActionTier;
  title: string;
  description: string;
  category: 'hydration' | 'exercise' | 'nutrition' | 'sleep' | 'escalate' | 'monitor';
}

export interface TriageResult {
  indicatorId: HealthIndicatorId;
  value: number;
  unit: string;
  severity: Severity;
  hazards: HazardId[];
  summary: string;
  why: string;
  actions: CountermeasureAction[];
}

export interface SymptomFlags {
  sansVisualChanges: boolean;
  rash: boolean;
  orthostaticDizziness: boolean;
}

/** Per-region discomfort logged via body map / check-in (0 = none, 10 = severe). */
export interface RegionDiscomfortEntry {
  level: number;
  note: string;
}

export type RegionDiscomfortMap = Partial<Record<BodyRegionId, RegionDiscomfortEntry>>;

export interface CheckInInput {
  hr: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  temp: number;
  glucose: number;
  sleepH: number;
  mood: number;
  exerciseMin: number;
  /** Estimated daily radiation dose (mSv/day) — space radiation hazard. */
  radiationMsv: number;
  /** Cabin CO₂ partial pressure proxy in ppm — closed environment. */
  cabinCo2Ppm: number;
  /** Subjective stress 1–10 — isolation / behavioral. */
  stress: number;
  /** Subjective fatigue 1–10 — isolation / workload. */
  fatigue: number;
  notes?: string;
  symptoms?: Partial<SymptomFlags>;
  regionDiscomfort?: RegionDiscomfortMap;
  /** Optional camera / imaging attach (data URL or empty). */
  photoDataUrl?: string;
}

export interface CrewProfile {
  id: string;
  name: string;
  role: string;
  missionDay: number;
  environment: MissionEnvironment;
  xp: number;
  streak: number;
  onboarded: boolean;
  /** Browser notification reminders enabled. */
  remindersEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRecord extends CheckInInput {
  id: string;
  profileId: string;
  timestamp: string;
  symptoms: SymptomFlags;
  notes: string;
  regionDiscomfort: RegionDiscomfortMap;
  photoDataUrl: string;
  overallSeverity: Severity;
}

export interface RoutineItem {
  id: string;
  label: string;
  description: string;
  schedule: 'wake' | 'midday' | 'pre_sleep';
}

export interface RoutineCompletion {
  id: string;
  profileId: string;
  routineId: string;
  missionDay: number;
  completedAt: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface UnlockedBadge {
  id: string;
  profileId: string;
  badgeId: string;
  unlockedAt: string;
}

export const SEVERITY_RANK: Record<Severity, number> = {
  green: 0,
  yellow: 1,
  amber: 2,
  red: 3,
};

export function maxSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Fill defaults for older local records missing study-guide fields. */
export function normalizeCheckInInput(input: Partial<CheckInInput> & Pick<
  CheckInInput,
  'hr' | 'bpSys' | 'bpDia' | 'spo2' | 'temp' | 'glucose' | 'sleepH' | 'mood' | 'exerciseMin'
>): CheckInInput {
  return {
    ...input,
    radiationMsv: input.radiationMsv ?? 0.35,
    cabinCo2Ppm: input.cabinCo2Ppm ?? 800,
    stress: input.stress ?? 5,
    fatigue: input.fatigue ?? 5,
    notes: input.notes ?? '',
    symptoms: input.symptoms ?? {},
    regionDiscomfort: input.regionDiscomfort ?? {},
    photoDataUrl: input.photoDataUrl ?? '',
  };
}
