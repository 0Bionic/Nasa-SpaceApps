import { INDICATORS } from '@/domain/indicators';
import type {
  CheckInInput,
  HealthIndicatorId,
  MissionEnvironment,
  Severity,
} from '@/domain/types';

export const SEVERITY_COLOR: Record<Severity, string> = {
  green: '#3CCB8A',
  yellow: '#EFCB45',
  amber: '#FF9A3D',
  red: '#FF5C61',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  green: 'Nominal',
  yellow: 'Caution',
  amber: 'Warning',
  red: 'Critical',
};

/** Which CheckInInput field holds each indicator. */
export const INDICATOR_FIELD: Record<HealthIndicatorId, keyof CheckInInput> = {
  hr: 'hr',
  bp_sys: 'bpSys',
  bp_dia: 'bpDia',
  spo2: 'spo2',
  temp: 'temp',
  glucose: 'glucose',
  sleep_h: 'sleepH',
  mood: 'mood',
  exercise_min: 'exerciseMin',
};

export function indicatorValue(
  input: CheckInInput | null | undefined,
  id: HealthIndicatorId,
): number | null {
  if (!input) return null;
  const v = input[INDICATOR_FIELD[id]];
  return typeof v === 'number' ? v : null;
}

/** Visible span of each instrument scale. */
export const SCALE_RANGE: Record<HealthIndicatorId, [number, number]> = {
  hr: [30, 140],
  bp_sys: [70, 180],
  bp_dia: [40, 110],
  spo2: [85, 100],
  temp: [34.5, 39.5],
  glucose: [40, 260],
  sleep_h: [0, 12],
  mood: [1, 10],
  exercise_min: [0, 120],
};

export interface ScaleSegment {
  from: number;
  to: number;
  severity: Severity;
}

/** Threshold bands clipped to the visible range, as 0–1 fractions. */
export function scaleSegments(id: HealthIndicatorId): ScaleSegment[] {
  const [lo, hi] = SCALE_RANGE[id];
  const span = hi - lo;
  return INDICATORS[id].bands
    .map((b) => {
      const a = Math.max(lo, b.min ?? lo);
      const z = Math.min(hi, b.max ?? hi);
      return { from: (a - lo) / span, to: (z - lo) / span, severity: b.severity };
    })
    .filter((s) => s.to > s.from)
    .sort((x, y) => x.from - y.from)
    .map((s, i, arr) => ({
      ...s,
      // Integer bands leave hairline gaps (90 | 91); close them so the track reads continuous.
      to: i < arr.length - 1 ? Math.max(s.to, arr[i + 1].from) : 1,
      from: i === 0 ? 0 : s.from,
    }));
}

export function scalePosition(id: HealthIndicatorId, value: number): number {
  const [lo, hi] = SCALE_RANGE[id];
  return Math.min(1, Math.max(0, (value - lo) / (hi - lo)));
}

export function formatValue(id: HealthIndicatorId, value: number): string {
  const decimals = id === 'temp' || id === 'sleep_h' ? 1 : 0;
  return value.toFixed(decimals);
}

export function formatUnit(id: HealthIndicatorId): string {
  return INDICATORS[id].unit;
}

/** Approximate one-way signal delay to Earth for each habitat. */
export const EARTH_DELAY: Record<MissionEnvironment, { value: string; note: string }> = {
  station: { value: '<1 s', note: 'Low Earth orbit' },
  surface_base: { value: '1.3 s', note: 'Lunar surface' },
  rover: { value: '1.3 s', note: 'Lunar surface' },
  spacecraft: { value: 'up to 22 min', note: 'Deep-space transit' },
};

export const ENVIRONMENT_LABEL: Record<MissionEnvironment, string> = {
  spacecraft: 'Transit vehicle',
  station: 'Orbital station',
  rover: 'Surface rover',
  surface_base: 'Surface base',
};

/** "4.2 h", "98 %", but "4/10". */
export function withUnit(id: HealthIndicatorId, value: number): string {
  const unit = INDICATORS[id].unit;
  return `${formatValue(id, value)}${unit.startsWith('/') ? '' : ' '}${unit}`;
}
