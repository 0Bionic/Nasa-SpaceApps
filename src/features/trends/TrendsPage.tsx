import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { severityFor } from '@/domain/triage/engine';
import { INDICATORS } from '@/domain/indicators';
import type { HealthIndicatorId } from '@/domain/types';
import { SeverityGlyph } from '@/components/SeverityBadge';
import { INDICATOR_FIELD, SEVERITY_COLOR, formatValue, withUnit } from '@/components/vitals';

const METRICS: HealthIndicatorId[] = [
  'sleep_h',
  'mood',
  'stress',
  'fatigue',
  'hr',
  'bp_sys',
  'spo2',
  'temp',
  'glucose',
  'exercise_min',
  'cabin_co2',
  'radiation_msv',
];

function greenBand(id: HealthIndicatorId): [number, number] {
  const g = INDICATORS[id].bands.find((b) => b.severity === 'green')!;
  return [g.min ?? 0, g.max ?? 0];
}

export function TrendsPage() {
  const history = useAppStore((s) => s.history);
  const [days, setDays] = useState<7 | 30>(30);
  const [metric, setMetric] = useState<HealthIndicatorId>('sleep_h');

  const def = INDICATORS[metric];
  const [gMin, gMax] = greenBand(metric);
  const field = INDICATOR_FIELD[metric];

  const ordered = useMemo(() => [...history].reverse().slice(-days), [history, days]);

  const data = useMemo(
    () =>
      ordered.map((c) => {
        const v = c[field] as number;
        return {
          day: new Date(c.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: v,
          sev: severityFor(metric, v),
        };
      }),
    [ordered, field, metric],
  );

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const vals = data.map((d) => d.value);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const half = Math.floor(vals.length / 2);
    const first = vals.slice(0, half);
    const second = vals.slice(half);
    const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const delta = mean(second) - mean(first);
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].sev === 'green') break;
      streak += 1;
    }
    return {
      latest: data[data.length - 1],
      avg,
      delta,
      inBand: data.filter((d) => d.sev === 'green').length,
      streak,
    };
  }, [data]);

  const lineColor = '#5BA8FF';

  return (
    <div className="space-y-7">
      <header>
        <h1 className="h-page">Trends</h1>
        <p className="lede mt-2">
          History for each indicator. Green band is the nominal range.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Reading">
          {METRICS.map((id) => {
            const latestV = history[0] ? (history[0][INDICATOR_FIELD[id]] as number) : null;
            const sev = latestV != null ? severityFor(id, latestV) : 'green';
            const active = metric === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMetric(id)}
                className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'border-limb/60 bg-deck text-star' : 'border-rule text-dust hover:border-rule-strong hover:text-star'
                }`}
              >
                {INDICATORS[id].label}
                {sev !== 'green' && <SeverityGlyph severity={sev} size={8} />}
              </button>
            );
          })}
        </div>
        <div className="seg" role="group" aria-label="Time range">
          {([7, 30] as const).map((d) => (
            <button key={d} type="button" className="seg-item" aria-pressed={days === d} onClick={() => setDays(d)}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {stats && stats.streak >= 3 && (
        <div className="flex gap-3 rounded-lg border border-sev-amber/40 bg-sev-amber/10 px-4 py-3" role="status">
          <span className="mt-1">
            <SeverityGlyph severity="amber" />
          </span>
          <p className="text-sm text-[#FFD4A0]">
            {def.label} outside nominal for {stats.streak} check-ins. Review Guidance and note in the
            next ground packet.
          </p>
        </div>
      )}

      <section className="surface p-4 sm:p-6" aria-label={`${def.label} chart`}>
        {stats && (
          <dl className="mb-6 grid grid-cols-2 gap-y-4 sm:grid-cols-4">
            <Stat label="Latest" value={withUnit(metric, stats.latest.value)} color={stats.latest.sev === 'green' ? undefined : SEVERITY_COLOR[stats.latest.sev]} />
            <Stat label={`${days}-day average`} value={withUnit(metric, stats.avg)} />
            <Stat
              label="Change over period"
              value={`${stats.delta >= 0 ? '+' : '−'}${formatValue(metric, Math.abs(stats.delta))}`}
            />
            <Stat label="Days in safe range" value={`${stats.inBand} of ${data.length}`} />
          </dl>
        )}

        <div className="h-[320px] w-full sm:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1A3F78" strokeDasharray="0" vertical={false} />
              <ReferenceArea ifOverflow="hidden" y1={gMin} y2={gMax} fill="#4AA564" fillOpacity={0.08} stroke="#4AA564" strokeOpacity={0.25} strokeDasharray="3 4" />
              <XAxis
                dataKey="day"
                stroke="#2A5AA0"
                tick={{ fill: '#A7B6CE', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2A5AA0' }}
                minTickGap={24}
              />
              <YAxis
                stroke="#2A5AA0"
                tick={{ fill: '#A7B6CE', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                width={44}
              />
              <Tooltip
                cursor={{ stroke: '#5BA8FF', strokeOpacity: 0.4 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-md border border-rule-strong bg-deck px-3 py-2 text-xs shadow-lg">
                      <p className="text-dust">{label}</p>
                      <p className="readout mt-0.5 text-base" style={{ color: p.sev === 'green' ? '#FFFFFF' : SEVERITY_COLOR[p.sev] }}>
                        {withUnit(metric, p.value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="value" stroke="none" fill="url(#trend-fill)" isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="value"
                name={def.label}
                stroke={lineColor}
                strokeWidth={2}
                dot={(props: { cx?: number; cy?: number; payload?: { sev: keyof typeof SEVERITY_COLOR }; index?: number }) => {
                  const { cx, cy, payload, index } = props;
                  if (cx == null || cy == null || !payload) return <g key={index} />;
                  const off = payload.sev !== 'green';
                  return (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={off ? 3.5 : 2}
                      fill={off ? SEVERITY_COLOR[payload.sev] : '#060F24'}
                      stroke={off ? '#060F24' : lineColor}
                      strokeWidth={off ? 1.5 : 1.25}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: lineColor, stroke: '#060F24', strokeWidth: 2 }}
                animationDuration={600}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-xs text-faint">
          Safe range {gMin}–{gMax} {def.unit}. Colored points are readings outside it.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <dt className="text-xs text-dust">{label}</dt>
      <dd className="readout mt-1 text-xl" style={{ color }}>
        {value}
      </dd>
    </div>
  );
}
