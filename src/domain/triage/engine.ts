import { ACTIONS, actionsFor } from '../countermeasures';
import { INDICATORS } from '../indicators';
import { BODY_REGIONS } from '../regions';
import type {
  BodyRegionId,
  CheckInInput,
  HealthIndicatorId,
  RegionDiscomfortMap,
  Severity,
  SymptomFlags,
  TriageResult,
} from '../types';
import { maxSeverity, normalizeCheckInInput } from '../types';

function bandMatches(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

export function severityFor(indicatorId: HealthIndicatorId, value: number): Severity {
  const def = INDICATORS[indicatorId];
  for (const band of def.bands) {
    if (bandMatches(value, band.min, band.max)) return band.severity;
  }
  return 'amber';
}

function whyText(indicatorId: HealthIndicatorId, severity: Severity): string {
  const def = INDICATORS[indicatorId];
  if (severity === 'green') {
    return `${def.label} is within the mission green band. Continue routine monitoring.`;
  }
  const hazardNames = def.hazards.map((h) => h.replace('_', ' ')).join(', ');
  return `${def.whyNeeded} Linked spaceflight hazards: ${hazardNames}.`;
}

function summaryText(indicatorId: HealthIndicatorId, value: number, severity: Severity): string {
  const def = INDICATORS[indicatorId];
  const labels: Record<Severity, string> = {
    green: 'Optimal',
    yellow: 'Caution — mild deviation',
    amber: 'Warning — significant anomaly',
    red: 'Critical — threshold breach',
  };
  return `${def.label} ${value}${def.unit === '/10' ? '' : ' '}${def.unit === '/10' ? '/10' : def.unit}: ${labels[severity]}`;
}

export function triageIndicator(indicatorId: HealthIndicatorId, value: number): TriageResult {
  const def = INDICATORS[indicatorId];
  const severity = severityFor(indicatorId, value);
  return {
    indicatorId,
    value,
    unit: def.unit,
    severity,
    hazards: def.hazards,
    summary: summaryText(indicatorId, value, severity),
    why: whyText(indicatorId, severity),
    actions: actionsFor(indicatorId, severity),
  };
}

const VALUE_MAP: Record<HealthIndicatorId, (c: CheckInInput) => number> = {
  hr: (c) => c.hr,
  bp_sys: (c) => c.bpSys,
  bp_dia: (c) => c.bpDia,
  spo2: (c) => c.spo2,
  temp: (c) => c.temp,
  glucose: (c) => c.glucose,
  sleep_h: (c) => c.sleepH,
  mood: (c) => c.mood,
  exercise_min: (c) => c.exerciseMin,
  radiation_msv: (c) => c.radiationMsv,
  cabin_co2: (c) => c.cabinCo2Ppm,
  stress: (c) => c.stress,
  fatigue: (c) => c.fatigue,
};

export function triageCheckIn(input: Partial<CheckInInput> & CheckInInput): TriageResult[] {
  const normalized = normalizeCheckInInput(input);
  const results = (Object.keys(VALUE_MAP) as HealthIndicatorId[]).map((id) =>
    triageIndicator(id, VALUE_MAP[id](normalized)),
  );

  // SANS flag → attach ocular screen guidance even if vitals are green
  if (normalized.symptoms?.sansVisualChanges) {
    const head = results.find((r) => r.indicatorId === 'mood') ?? results[0];
    if (head && !head.actions.some((a) => a.id === 'sans_screen')) {
      head.actions = [ACTIONS.sans_screen, ...head.actions];
      head.severity = maxSeverity(head.severity, 'amber');
      head.summary = `${head.summary} · SANS visual-change flag`;
      head.why = `${head.why} Visual changes can signal Spaceflight-Associated Neuro-ocular Syndrome (SANS).`;
      if (!head.hazards.includes('gravity')) head.hazards = [...head.hazards, 'gravity'];
    }
  }

  return results;
}

export function overallSeverity(results: TriageResult[]): Severity {
  return results.reduce<Severity>((acc, r) => maxSeverity(acc, r.severity), 'green');
}

export function regionSeverity(
  regionId: BodyRegionId,
  results: TriageResult[],
  symptoms?: SymptomFlags,
  discomfort?: RegionDiscomfortMap,
): Severity {
  const region = BODY_REGIONS[regionId];
  const relevant = results.filter((r) => region.indicators.includes(r.indicatorId));
  let sev = relevant.reduce<Severity>((acc, r) => maxSeverity(acc, r.severity), 'green');

  if (symptoms) {
    if (regionId === 'head_eyes' && symptoms.sansVisualChanges) {
      sev = maxSeverity(sev, 'amber');
    }
    if (regionId === 'skin_immune' && symptoms.rash) {
      sev = maxSeverity(sev, 'amber');
    }
    if ((regionId === 'cardio' || regionId === 'msk') && symptoms.orthostaticDizziness) {
      sev = maxSeverity(sev, 'yellow');
    }
  }

  const d = discomfort?.[regionId];
  if (d) {
    if (d.level >= 8) sev = maxSeverity(sev, 'red');
    else if (d.level >= 6) sev = maxSeverity(sev, 'amber');
    else if (d.level >= 3) sev = maxSeverity(sev, 'yellow');
  }

  return sev;
}

export function allRegionSeverities(
  results: TriageResult[],
  symptoms?: SymptomFlags,
  discomfort?: RegionDiscomfortMap,
): Record<BodyRegionId, Severity> {
  const out = {} as Record<BodyRegionId, Severity>;
  for (const id of Object.keys(BODY_REGIONS) as BodyRegionId[]) {
    out[id] = regionSeverity(id, results, symptoms, discomfort);
  }
  return out;
}

/** Simple early-warning: value moved ≥ threshold vs previous reading. */
export function unusualChange(
  id: HealthIndicatorId,
  current: number,
  previous: number | null | undefined,
): boolean {
  if (previous == null) return false;
  const deltas: Partial<Record<HealthIndicatorId, number>> = {
    hr: 15,
    bp_sys: 20,
    bp_dia: 12,
    spo2: 3,
    temp: 0.6,
    glucose: 40,
    sleep_h: 2,
    mood: 3,
    exercise_min: 30,
    radiation_msv: 0.4,
    cabin_co2: 800,
    stress: 3,
    fatigue: 3,
  };
  const lim = deltas[id] ?? 10;
  return Math.abs(current - previous) >= lim;
}
