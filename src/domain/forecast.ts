import { INDICATORS, INDICATOR_DECIMALS } from './indicators';
import { severityFor } from './triage/engine';
import type { HealthIndicatorId } from './types';

export type Forecast =
  /** In range now, but the trend crosses out of it within the horizon. */
  | { kind: 'leaving'; checkIns: number; slope: number; boundary: number }
  /** Out of range and still moving away from it. */
  | { kind: 'worsening'; slope: number }
  /** Out of range but moving back toward it. */
  | { kind: 'recovering'; slope: number };

const WINDOW = 7;
const HORIZON = 7;

/** Least-squares slope and fitted last value over evenly spaced points. */
function fit(values: number[]) {
  const n = values.length;
  const xm = (n - 1) / 2;
  const ym = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xm) * (values[i] - ym);
    den += (i - xm) ** 2;
  }
  const slope = den ? num / den : 0;
  return { slope, last: ym + slope * (n - 1 - xm) };
}

/**
 * Early warning from the last 7 check-ins (oldest → newest).
 * Flags a reading that is still nominal but trending toward its limit, so the
 * crew can act before an alert fires. Returns null when there is no clear trend.
 */
export function forecast(id: HealthIndicatorId, series: number[]): Forecast | null {
  const values = series.slice(-WINDOW);
  if (values.length < 5) return null;
  const { slope, last } = fit(values);
  const step = 10 ** -INDICATOR_DECIMALS[id];
  if (Math.abs(slope) < step / 2) return null; // flat at recording precision

  const green = INDICATORS[id].bands.find((b) => b.severity === 'green');
  if (!green) return null;
  const latest = values[values.length - 1];

  if (severityFor(id, latest) === 'green') {
    const boundary = slope > 0 ? (green.max !== undefined ? green.max + step : undefined) : green.min !== undefined ? green.min - step : undefined;
    if (boundary === undefined) return null;
    const checkIns = (boundary - last) / slope;
    if (checkIns <= 0 || checkIns > HORIZON) return null;
    return { kind: 'leaving', checkIns: Math.max(1, Math.round(checkIns)), slope, boundary };
  }

  const above = green.max !== undefined && latest > green.max;
  const movingAway = above ? slope > 0 : slope < 0;
  return movingAway ? { kind: 'worsening', slope } : { kind: 'recovering', slope };
}

export function forecastText(id: HealthIndicatorId, f: Forecast): string {
  const unit = INDICATORS[id].unit;
  const rate = `${f.slope > 0 ? '+' : '−'}${Math.abs(f.slope).toFixed(INDICATOR_DECIMALS[id] + 1)}${unit.startsWith('/') ? '' : ' '}${unit} per check-in`;
  if (f.kind === 'leaving') return `Trending out of range: likely Caution in ~${f.checkIns} check-in${f.checkIns === 1 ? '' : 's'} (${rate})`;
  if (f.kind === 'worsening') return `Still worsening (${rate})`;
  return `Recovering toward range (${rate})`;
}
