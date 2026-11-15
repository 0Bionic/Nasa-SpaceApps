import { severityFor } from './triage/engine';
import { SEVERITY_RANK, type Severity } from './types';
import type { SourceId } from './evidence';

/**
 * Continuous monitoring, scoped to where NASA and CSA actually use it
 * (see docs/Continuous-Monitoring-Evidence.md):
 *   - EVA: ECG / heart rate monitored live (OCHMO-STD-100.1A [6030])
 *   - Exercise: heart-rate monitoring is a medical requirement on ISS (NASA Miniature Biometric Sensor project)
 *   - 24-hour recording sessions, stored on the device and sent later (CSA Bio-Monitor; NASA–CSA HERA Astroskin study)
 * Routine vitals stay in the daily check-in, matching NASA's periodic model.
 */

export type MonitorMode = 'eva' | 'exercise' | 'ambulatory';

export type Activity = 'sleep' | 'rest' | 'active' | 'exertion';

export interface MonitorSample {
  /** Seconds since the session started (simulated mission time). */
  t: number;
  /** Null while the sensor has no reading (dropout). */
  hr: number | null;
  spo2: number | null;
  resp: number | null;
  skinTemp: number | null;
  /** Signal quality 0–1. Below QUALITY_MIN the sample is treated as artifact. */
  quality: number;
  activity: Activity;
}

export type MonitorMetric = 'hr' | 'spo2';

export interface MonitorEvent {
  t: number;
  kind: 'health' | 'signal';
  metric?: MonitorMetric;
  severity: Severity;
  message: string;
}

export interface MonitorStats {
  hr: { min: number; max: number; mean: number } | null;
  spo2: { min: number; max: number; mean: number } | null;
  /** Share of samples with usable signal, 0–100. */
  goodPct: number;
  dropouts: number;
}

export interface MonitorSession {
  id: string;
  profileId: string;
  mode: MonitorMode;
  startedAt: string;
  endedAt: string;
  /** Simulated seconds covered by the recording. */
  durationS: number;
  samples: MonitorSample[];
  events: MonitorEvent[];
  stats: MonitorStats;
  worstSeverity: Severity;
  /** False until the session has gone out in a ground packet (store-and-forward). */
  downlinked: boolean;
}

export interface ModeInfo {
  label: string;
  short: string;
  description: string;
  basis: string;
  sources: SourceId[];
}

export const MODE_INFO: Record<MonitorMode, ModeInfo> = {
  eva: {
    label: 'EVA',
    short: 'EVA',
    description: 'Live heart rate and SpO₂ while suited. Alerts run on this device, so they work with no ground link.',
    basis: 'NASA requires ECG and heart-rate monitoring during every EVA, with immediate feedback to the EVA Flight Director.',
    sources: ['ochmo-100', 'nasa-telemed'],
  },
  exercise: {
    label: 'Exercise',
    short: 'Exercise',
    description: 'Live heart rate against an exertion ceiling during a workout or fitness test.',
    basis: 'Heart-rate monitoring is a medical requirement during ISS exercise and fitness tests.',
    sources: ['nasa-hr-sensor'],
  },
  ambulatory: {
    label: '24-h session',
    short: '24 h',
    description: 'A full-day recording stored on the device and sent with the next ground packet, like CSA Bio-Monitor.',
    basis: 'CSA Bio-Monitor records sessions on the device and downloads them afterwards; in the HERA study, recording onboard lasted 24 h where live streaming did not.',
    sources: ['csa-biomonitor', 'nasa-hera-astroskin'],
  },
};

/* ------------------------------------------------------------------ */
/* Thresholds                                                          */
/* ------------------------------------------------------------------ */

/** Samples below this quality are artifact (motion, poor skin contact) and never raise health alerts. */
export const QUALITY_MIN = 0.5;

/**
 * No age is stored in the crew profile, so the exertion ceiling assumes a 40-year-old.
 * Age-predicted max HR = 220 − age is a common clinical estimate (app heuristic, not a NASA limit).
 */
export const ASSUMED_AGE = 40;
export const HR_MAX = 220 - ASSUMED_AGE;

/** Exertion bands as % of age-predicted max HR (app heuristic). */
export const EXERTION_BANDS: { severity: Severity; minPct: number }[] = [
  { severity: 'red', minPct: 100 },
  { severity: 'amber', minPct: 95 },
  { severity: 'yellow', minPct: 85 },
];

/** Heart-rate severity depends on activity: resting bands at rest/sleep, an exertion ceiling when working. */
export function hrSeverity(hr: number, activity: Activity): Severity {
  if (activity === 'sleep' || activity === 'rest') return severityFor('hr', hr);
  if (hr <= 39) return 'red';
  const pct = (hr / HR_MAX) * 100;
  return EXERTION_BANDS.find((b) => pct >= b.minPct)?.severity ?? 'green';
}

/** SpO₂ uses the same evidence-based bands as the check-in at any activity level. */
export function spo2Severity(spo2: number): Severity {
  return severityFor('spo2', spo2);
}

/* ------------------------------------------------------------------ */
/* Live alert engine                                                   */
/* ------------------------------------------------------------------ */

export interface EngineOptions {
  /** Consecutive good samples a severity must hold before it alerts (filters spikes). */
  persist: number;
  /** Consecutive unusable samples before "signal lost". */
  lossAfter: number;
}

export interface MetricState {
  /** Severity currently alerted (after persistence). */
  active: Severity;
  /** Candidate severity and how many good samples it has held. */
  pending: Severity;
  run: number;
}

/**
 * Stateful, on-device alerting. A severity must persist across several good samples
 * before it alerts, and dropouts raise a "signal" event instead of a health alert:
 * NASA reports wearable heart-rate data is prone to drop-out and motion artifact.
 */
export class MonitorEngine {
  readonly events: MonitorEvent[] = [];
  readonly state: Record<MonitorMetric, MetricState> = {
    hr: { active: 'green', pending: 'green', run: 0 },
    spo2: { active: 'green', pending: 'green', run: 0 },
  };
  badRun = 0;
  signalLost = false;
  private dropouts = 0;
  private good = 0;
  private total = 0;
  private hrVals: number[] = [];
  private spo2Vals: number[] = [];
  worst: Severity = 'green';

  constructor(private opts: EngineOptions) {}

  push(s: MonitorSample): MonitorEvent[] {
    const out: MonitorEvent[] = [];
    this.total++;
    const usable = s.quality >= QUALITY_MIN && s.hr != null;

    if (!usable) {
      this.badRun++;
      if (!this.signalLost && this.badRun >= this.opts.lossAfter) {
        this.signalLost = true;
        this.dropouts++;
        out.push({ t: s.t, kind: 'signal', severity: 'yellow', message: 'Signal lost: check sensor contact. Alerts paused until it returns.' });
      }
      this.events.push(...out);
      return out;
    }

    if (this.signalLost) {
      this.signalLost = false;
      out.push({ t: s.t, kind: 'signal', severity: 'green', message: 'Signal restored.' });
    }
    this.badRun = 0;
    this.good++;

    const checks: [MonitorMetric, number | null, (v: number) => Severity][] = [
      ['hr', s.hr, (v) => hrSeverity(v, s.activity)],
      ['spo2', s.spo2, spo2Severity],
    ];
    for (const [metric, value, sev] of checks) {
      if (value == null) continue;
      (metric === 'hr' ? this.hrVals : this.spo2Vals).push(value);
      const ev = this.update(metric, sev(value), value, s);
      if (ev) out.push(ev);
    }
    this.events.push(...out);
    return out;
  }

  private update(metric: MonitorMetric, sev: Severity, value: number, s: MonitorSample): MonitorEvent | null {
    const st = this.state[metric];
    if (sev === st.pending) st.run++;
    else {
      st.pending = sev;
      st.run = 1;
    }
    if (st.run < this.opts.persist || st.pending === st.active) return null;

    const prev = st.active;
    st.active = st.pending;
    if (SEVERITY_RANK[st.active] > SEVERITY_RANK[this.worst]) this.worst = st.active;

    const name = metric === 'hr' ? 'Heart rate' : 'SpO₂';
    const unit = metric === 'hr' ? ' bpm' : '%';
    const v = `${Math.round(value)}${unit}`;
    if (st.active === 'green') {
      return { t: s.t, kind: 'health', metric, severity: 'green', message: `${name} back in range (${v}).` };
    }
    const context =
      metric === 'hr' && (s.activity === 'active' || s.activity === 'exertion')
        ? ` (${Math.round((value / HR_MAX) * 100)}% of max)`
        : '';
    const verb = SEVERITY_RANK[st.active] > SEVERITY_RANK[prev] ? 'worsening' : 'improving';
    return {
      t: s.t,
      kind: 'health',
      metric,
      severity: st.active,
      message: `${name} ${verb}: ${v}${context}. ${ACTION[st.active]}`,
    };
  }

  stats(): MonitorStats {
    const agg = (a: number[]) =>
      a.length ? { min: Math.min(...a), max: Math.max(...a), mean: a.reduce((x, y) => x + y, 0) / a.length } : null;
    return {
      hr: agg(this.hrVals),
      spo2: agg(this.spo2Vals),
      goodPct: this.total ? Math.round((this.good / this.total) * 100) : 0,
      dropouts: this.dropouts,
    };
  }
}

const ACTION: Record<Severity, string> = {
  green: '',
  yellow: 'Ease the pace and keep watching.',
  amber: 'Stop and rest; tell the CMO.',
  red: 'Stop now; CMO and ground per protocol.',
};

/** Keep stored sessions small: at most `max` evenly spaced samples. */
export function downsample<T>(xs: T[], max = 1440): T[] {
  if (xs.length <= max) return xs;
  const step = xs.length / max;
  return Array.from({ length: max }, (_, i) => xs[Math.floor(i * step)]);
}

export function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h) return `${h} h ${String(m).padStart(2, '0')} min`;
  if (m) return `${m} min ${String(sec).padStart(2, '0')} s`;
  return `${sec} s`;
}

/* ------------------------------------------------------------------ */
/* Sleep (actigraphy)                                                  */
/* ------------------------------------------------------------------ */

export interface SleepNight {
  missionDay: number;
  /** Minutes after 18:00 the crew member fell asleep. */
  onsetMin: number;
  totalSleepH: number;
  efficiencyPct: number;
  awakenings: number;
  /** Movement counts per 10-minute epoch from onset to wake. */
  epochs: number[];
}
