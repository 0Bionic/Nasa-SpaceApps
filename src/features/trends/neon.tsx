import type { CheckInRecord, HealthIndicatorId, Severity } from '@/domain/types';
import { INDICATORS } from '@/domain/indicators';
import { severityFor } from '@/domain/triage/engine';
import { forecast, type Forecast } from '@/domain/forecast';
import { INDICATOR_FIELD } from '@/components/vitals';

export const NEON = 'rgb(var(--c-accent))';
export const NASA_RED = 'rgb(var(--c-red))';
/** Theme-aware colors for SVG/chart props (CSS variables, swap with light/dark mode). */
export const C = {
  bg: 'rgb(var(--c-bg))',
  text: 'rgb(var(--c-text))',
  muted: 'rgb(var(--c-muted))',
  dim: 'rgb(var(--c-dim))',
  line: 'rgb(var(--c-line))',
  grid: 'rgb(var(--c-line) / 0.45)',
  green: 'rgb(var(--sev-green))',
};

export type IndicatorCategory = 'physiological' | 'behavioural' | 'habitat';

export const CATEGORY_LABEL: Record<IndicatorCategory, string> = {
  physiological: 'Physiological',
  behavioural: 'Behavioural',
  habitat: 'Habitat',
};

/** Indicators shown in Analytics, with a short glyph and grouping. */
export const ANALYTICS_METRICS: { id: HealthIndicatorId; glyph: string; category: IndicatorCategory }[] = [
  { id: 'hr', glyph: 'HR', category: 'physiological' },
  { id: 'bp_sys', glyph: 'BP', category: 'physiological' },
  { id: 'spo2', glyph: 'O₂', category: 'physiological' },
  { id: 'temp', glyph: 'TC', category: 'physiological' },
  { id: 'glucose', glyph: 'GL', category: 'physiological' },
  { id: 'sleep_h', glyph: 'SL', category: 'behavioural' },
  { id: 'mood', glyph: 'MD', category: 'behavioural' },
  { id: 'stress', glyph: 'ST', category: 'behavioural' },
  { id: 'fatigue', glyph: 'FT', category: 'behavioural' },
  { id: 'exercise_min', glyph: 'EX', category: 'behavioural' },
  { id: 'resistive_min', glyph: 'RX', category: 'behavioural' },
  { id: 'teamwork', glyph: 'TM', category: 'behavioural' },
  { id: 'dizziness', glyph: 'VS', category: 'physiological' },
  { id: 'fluid_l', glyph: 'H₂O', category: 'physiological' },
  { id: 'cabin_co2', glyph: 'CO₂', category: 'habitat' },
  { id: 'radiation_msv', glyph: 'RD', category: 'habitat' },
];

export const METRIC_META = Object.fromEntries(ANALYTICS_METRICS.map((m) => [m.id, m])) as Record<
  HealthIndicatorId,
  (typeof ANALYTICS_METRICS)[number]
>;

export const SEVERITY_RANK: Record<Severity, number> = { green: 0, yellow: 1, amber: 2, red: 3 };

/** Tailwind classes + hex per severity, on the neon palette. */
export const SEV_TONE: Record<Severity, { text: string; border: string; dot: string; hex: string }> = {
  green: { text: 'text-n-green', border: 'border-n-line', dot: 'border-n-green bg-n-green/20', hex: 'rgb(var(--sev-green))' },
  yellow: { text: 'text-n-amber', border: 'border-n-amber/50', dot: 'border-n-amber bg-n-amber/20', hex: 'rgb(var(--sev-yellow))' },
  amber: { text: 'text-n-amber', border: 'border-n-amber/50', dot: 'border-n-amber bg-n-amber/20', hex: 'rgb(var(--sev-amber))' },
  red: { text: 'text-n-red', border: 'border-n-red/50', dot: 'border-n-red bg-n-red/20', hex: 'rgb(var(--sev-red))' },
};

export const SEV_SHORT: Record<Severity, string> = {
  green: 'Nominal',
  yellow: 'Caution',
  amber: 'Warning',
  red: 'Off-nominal',
};

export function valueOf(c: CheckInRecord, id: HealthIndicatorId): number {
  return c[INDICATOR_FIELD[id]] as number;
}

export interface IndicatorSummary {
  id: HealthIndicatorId;
  latest: number;
  severity: Severity;
  /** Percent change of latest vs mean of the 7 check-ins before it. */
  deltaPct: number | null;
  series: number[];
  /** Early-warning trend from the last 7 check-ins. */
  forecast: Forecast | null;
  /** Personal baseline from the 14 check-ins before the latest; flags readings unusual for this astronaut. */
  baseline: { mean: number; sd: number; z: number; unusual: boolean } | null;
}

/** history is newest-first, as stored. */
export function summarize(history: CheckInRecord[], id: HealthIndicatorId): IndicatorSummary | null {
  if (history.length === 0) return null;
  const latest = valueOf(history[0], id);
  const prior = history.slice(1, 8).map((c) => valueOf(c, id));
  const mean = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : null;
  return {
    id,
    latest,
    severity: severityFor(id, latest),
    deltaPct: mean ? ((latest - mean) / mean) * 100 : null,
    series: history
      .slice(0, 12)
      .reverse()
      .map((c) => valueOf(c, id)),
    baseline: personalBaseline(
      latest,
      history.slice(1, 15).map((c) => valueOf(c, id)),
    ),
    forecast: forecast(
      id,
      history
        .slice(0, 7)
        .reverse()
        .map((c) => valueOf(c, id)),
    ),
  };
}

/**
 * Compare today's reading with this astronaut's own recent history, not just fixed bands:
 * a reading 2+ standard deviations from their 14-check-in average is "unusual for you",
 * even when it is still inside the nominal range.
 */
export function personalBaseline(latest: number, prior: number[]) {
  if (prior.length < 7) return null;
  const mean = prior.reduce((a, b) => a + b, 0) / prior.length;
  const sd = Math.sqrt(prior.reduce((a, b) => a + (b - mean) ** 2, 0) / (prior.length - 1));
  if (!(sd > 0)) return null;
  const z = (latest - mean) / sd;
  return { mean, sd, z, unusual: Math.abs(z) >= 2 };
}

export function unitLabel(id: HealthIndicatorId): string {
  return INDICATORS[id].unit;
}

function smoothPath(pts: [number, number][]): string {
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

/** Glowing sparkline with area fill and an end-point marker. */
export function Sparkline({ series, color = NEON, height = 84 }: { series: number[]; color?: string; height?: number }) {
  const W = 264;
  const H = height;
  if (series.length < 2) {
    return <div style={{ height: H }} className="flex items-center text-xs text-n-faint">Not enough check-ins yet</div>;
  }
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map(
    (v, i) => [4 + i * ((W - 12) / (series.length - 1)), 10 + (1 - (v - min) / span) * (H - 22)] as [number, number],
  );
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block w-full" style={{ height: H }} aria-hidden="true">
      <line x1="0" x2={W} y1={H * 0.55} y2={H * 0.55} stroke={C.dim} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      <path d={line} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={7} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={9} fill={color} fillOpacity={0.18} />
      <circle cx={last[0]} cy={last[1]} r={4} fill={C.bg} stroke={color} strokeWidth={2} />
    </svg>
  );
}

/** Minimal stroke icons used by the neon views (24px grid). */
const ICON_PATHS = {
  arrowUpRight: <path d="M8 16L16 8M9 8h7v7" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21h4" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  check: (
    <>
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  upload: (
    <>
      <path d="M12 3v12M7 8l5-5 5 5" />
      <path d="M5 21h14" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  signal: (
    <>
      <path d="M4 12a8 8 0 0 1 16 0" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <circle cx="12" cy="16" r="1.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </>
  ),
} as const;

export type NeonIconName = keyof typeof ICON_PATHS;

export function NIcon({ name, size = 16, className }: { name: NeonIconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
