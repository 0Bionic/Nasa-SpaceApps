import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
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
import { severityFor, triageIndicator } from '@/domain/triage/engine';
import { INDICATORS } from '@/domain/indicators';
import type { HealthIndicatorId, Severity } from '@/domain/types';
import { alpha, formatValue, withUnit } from '@/components/vitals';
import { downloadGroundPacket } from '@/data/exportPacket';
import {
  ANALYTICS_METRICS,
  C,
  CATEGORY_LABEL,
  METRIC_META,
  NEON,
  NIcon,
  SEVERITY_RANK,
  SEV_SHORT,
  SEV_TONE,
  Sparkline,
  summarize,
  unitLabel,
  valueOf,
  type IndicatorCategory,
  type IndicatorSummary,
} from './neon';

type CategoryFilter = 'all' | IndicatorCategory;
type DetailTab = 'trend' | 'range' | 'risk' | 'countermeasure';

const TABS: { id: DetailTab; title: string; sub: string }[] = [
  { id: 'trend', title: 'Trend', sub: 'Growth dynamics' },
  { id: 'range', title: 'Range', sub: 'Safe-band overview' },
  { id: 'risk', title: 'Risk', sub: 'Triage assessment' },
  { id: 'countermeasure', title: 'Countermeasure', sub: 'Recommended actions' },
];

function isMetric(v: string | null): v is HealthIndicatorId {
  return !!v && v in METRIC_META;
}

function greenBand(id: HealthIndicatorId): [number, number] {
  const g = INDICATORS[id].bands.find((b) => b.severity === 'green')!;
  return [g.min ?? 0, g.max ?? 0];
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function TrendsPage() {
  const history = useAppStore((s) => s.history);
  const profile = useAppStore((s) => s.profile);
  const [params, setParams] = useSearchParams();
  const paramMetric = params.get('metric');

  const [metric, setMetricState] = useState<HealthIndicatorId>(isMetric(paramMetric) ? paramMetric : 'sleep_h');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [tab, setTab] = useState<DetailTab>('trend');
  const [query, setQuery] = useState('');

  const maxDays = Math.max(3, Math.min(30, history.length));
  const [days, setDays] = useState(Math.min(14, maxDays));
  useEffect(() => setDays((d) => Math.min(d, maxDays)), [maxDays]);

  useEffect(() => {
    if (isMetric(paramMetric)) setMetricState(paramMetric);
  }, [paramMetric]);

  const setMetric = (id: HealthIndicatorId) => {
    setMetricState(id);
    setParams({ metric: id }, { replace: true });
  };

  const summaries = useMemo(
    () =>
      ANALYTICS_METRICS.map((m) => summarize(history, m.id)).filter((s): s is IndicatorSummary => s !== null),
    [history],
  );

  const watch = useMemo(() => summaries.filter((s) => s.severity !== 'green'), [summaries]);

  const featured = useMemo(() => {
    const pool = summaries.filter((s) => category === 'all' || METRIC_META[s.id].category === category);
    return [...pool].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]).slice(0, 3);
  }, [summaries, category]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ANALYTICS_METRICS.filter((m) => INDICATORS[m.id].label.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  // ---------- detail data ----------
  const def = INDICATORS[metric];
  const [gMin, gMax] = greenBand(metric);
  const ordered = useMemo(() => [...history].reverse().slice(-days), [history, days]);
  const data = useMemo(
    () =>
      ordered.map((c) => {
        const v = valueOf(c, metric);
        return {
          day: new Date(c.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: v,
          sev: severityFor(metric, v),
        };
      }),
    [ordered, metric],
  );

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const vals = data.map((d) => d.value);
    const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const half = Math.floor(vals.length / 2);
    const delta = mean(vals.slice(half)) - mean(vals.slice(0, half));
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].sev === 'green') break;
      streak += 1;
    }
    const counts: Record<Severity, number> = { green: 0, yellow: 0, amber: 0, red: 0 };
    for (const d of data) counts[d.sev] += 1;
    return { latest: data[data.length - 1], avg: mean(vals), delta, counts, streak };
  }, [data]);

  const latestRecord = history[0];
  const triage = latestRecord ? triageIndicator(metric, valueOf(latestRecord, metric)) : null;
  const latestSev = triage?.severity ?? 'green';
  const fill = maxDays > 3 ? ((days - 3) / (maxDays - 3)) * 100 : 100;

  return (
    <div className="space-y-6 font-ui text-n-text">
      {/* ---------- Top bar ---------- */}
      <div className="flex flex-wrap items-center gap-3 border-b border-n-line pb-4">
        {profile && (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-n-neon/80 bg-n-raised font-display text-xs font-medium text-n-neon">
              {initials(profile.name)}
            </span>
            <div className="leading-tight">
              <p className="flex items-center gap-1.5 text-[11px] text-n-muted">
                {profile.role}
                <span className="n-pill px-1.5 py-0 text-[9px]">Day {profile.missionDay}</span>
              </p>
              <p className="text-sm font-medium">{profile.name}</p>
            </div>
          </div>
        )}
        <Link to="/checkin" className="n-btn ml-1">
          Log check-in <NIcon name="check" />
        </Link>

        <div className="ml-auto flex items-center gap-2.5">
          <Link
            to="/guidance"
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-n-line bg-n-panel hover:border-n-neon/50"
            aria-label={watch.length ? `Guidance, ${watch.length} indicators need attention` : 'Guidance'}
          >
            <NIcon name="bell" size={17} />
            {watch.length > 0 && <span className="n-glow-hot absolute right-[7px] top-[7px] h-2 w-2 rounded-full bg-n-neon" />}
          </Link>
          <div className="relative">
            <label className="sr-only" htmlFor="indicator-search">
              Search indicators
            </label>
            <input
              id="indicator-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches[0]) {
                  setMetric(matches[0].id);
                  setQuery('');
                }
              }}
              placeholder="Search indicators"
              className="n-field h-[38px] w-44 pl-3 pr-9 sm:w-56"
              autoComplete="off"
            />
            <NIcon name="search" className="pointer-events-none absolute right-3 top-[11px] text-n-muted" />
            {matches.length > 0 && (
              <ul className="n-card absolute right-0 z-20 mt-2 w-full overflow-hidden p-1" role="listbox">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] hover:bg-n-neon/10"
                      onClick={() => {
                        setMetric(m.id);
                        setQuery('');
                      }}
                    >
                      {INDICATORS[m.id].label}
                      <span className="font-mono text-[10px] text-n-muted">{m.glyph}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            to="/profile"
            className="hidden h-[38px] items-center gap-2 rounded-[10px] border border-n-line bg-n-panel px-3 text-[13px] hover:border-n-neon/50 sm:flex"
          >
            Settings <NIcon name="sliders" />
          </Link>
        </div>
      </div>

      {/* ---------- Hero ---------- */}
      <div className="grid gap-5 xl:grid-cols-[1fr_310px]">
        <section aria-labelledby="vitals-title" className="min-w-0 space-y-3.5">
          <p className="flex items-center gap-2 text-xs text-n-muted">
            Watch window · latest check-in
            <span className="n-pill">{watch.length} off-nominal</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 id="vitals-title" className="mr-auto font-display text-[30px] font-medium tracking-[-0.02em]">
              Vital Indicators
            </h1>
            <div className="flex rounded-[10px] border border-n-line bg-n-panel p-0.5" role="group" aria-label="Category">
              {(['all', 'physiological', 'behavioural', 'habitat'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    category === c ? 'bg-n-blue font-medium text-white' : 'text-n-muted hover:text-n-text'
                  }`}
                >
                  {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          {featured.length === 0 ? (
            <p className="n-card p-6 text-sm text-n-muted">No check-ins yet. Log one to see your indicators.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((s) => (
                <IndicatorCard key={s.id} s={s} active={s.id === metric} onSelect={() => setMetric(s.id)} />
              ))}
            </div>
          )}
        </section>

        <aside
          className="n-glow relative flex flex-col gap-3.5 overflow-hidden rounded-[18px] border border-n-neon/85 bg-n-ink p-[22px]"
        >
          <div className="flex items-center gap-2">
            <NIcon name="download" size={18} className="text-n-neon" />
            <span className="mr-auto font-display text-[13px] font-medium">AetherHealth</span>
            <span className="rounded-md bg-n-red px-2 py-0.5 font-mono text-[10px] font-medium text-white">FHIR</span>
          </div>
          <h2 className="font-display text-[26px] font-medium tracking-[-0.02em]">Ground Packet</h2>
          <p className="text-[13px] leading-relaxed text-n-muted">
            Summary of every indicator, alert and countermeasure, ready for the next flight-surgeon downlink.
          </p>
          <div className="flex-1" />
          <button type="button" className="n-btn w-full py-3" onClick={() => downloadGroundPacket()}>
            Export to ground <NIcon name="upload" />
          </button>
          <Link to="/guidance" className="n-btn-ghost w-full py-3">
            Review guidance <NIcon name="clock" />
          </Link>
        </aside>
      </div>

      {/* ---------- Detail panel ---------- */}
      <section
        aria-label={`${def.label} detail`}
        className="n-glow space-y-4 rounded-[18px] border border-n-neon/60 bg-n-panel px-4 pb-5 pt-4 sm:px-5"
      >
        <div className="flex items-center gap-3 text-n-muted">
          <h2 className="mr-auto text-[13px]">Indicator detail</h2>
          <NIcon name="chart" size={17} />
          <NIcon name="clock" size={17} />
        </div>

        <div className="space-y-6 rounded-[14px] border border-n-line bg-n-ink p-4 sm:p-[22px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="min-w-0 space-y-2.5">
              {latestRecord && (
                <p className="flex items-center gap-1.5 text-xs text-n-muted">
                  Last check-in · {timeAgo(latestRecord.timestamp)} <NIcon name="clock" size={13} />
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative inline-block font-display text-[26px] font-medium tracking-[-0.02em]">
                  <label htmlFor="detail-metric" className="sr-only">
                    Indicator
                  </label>
                  {/* Invisible copy sizes the select to the current label, not the longest option. */}
                  <span aria-hidden="true" className="invisible block whitespace-nowrap pr-7">
                    {def.label} ({def.unit})
                  </span>
                  <select
                    id="detail-metric"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as HealthIndicatorId)}
                    className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent pr-7 text-n-text focus:outline-none focus-visible:ring-1 focus-visible:ring-n-neon/60"
                  >
                    {ANALYTICS_METRICS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-n-panel text-base">
                        {INDICATORS[m.id].label} ({unitLabel(m.id)})
                      </option>
                    ))}
                  </select>
                  <NIcon name="chevron" size={18} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-n-neon" />
                </div>
                <SeverityPill severity={latestSev} />
              </div>
              <p className="text-xs text-n-muted">{days}-day mean, all check-ins</p>
              <div className="flex flex-wrap items-center gap-3.5">
                <p className="flex items-baseline gap-1.5 font-display">
                  <span className="text-[56px] font-medium leading-none tracking-[-0.03em] sm:text-[64px]">
                    {stats ? formatValue(metric, stats.avg) : '—'}
                  </span>
                  <span className="text-[26px] text-n-muted">{def.unit}</span>
                </p>
                <Link to="/checkin" className="n-btn">
                  <NIcon name="plus" size={14} /> Log reading
                </Link>
                <Link to="/guidance" className="n-btn-ghost">
                  View guidance <NIcon name="arrowUpRight" size={14} />
                </Link>
              </div>
            </div>

            {/* Review window */}
            <div className="space-y-4 rounded-[14px] border border-n-line bg-n-panel px-[18px] pb-[18px] pt-4">
              <div className="flex items-start">
                <div className="mr-auto">
                  <h3 className="font-display text-lg font-medium">Review window</h3>
                  <p className="text-[11px] text-n-muted">Check-ins included (days)</p>
                </div>
                <span className="n-pill border-n-text/40 bg-n-text/5 text-n-text">{maxDays} days max</span>
              </div>
              <div className="relative pt-7">
                <span
                  className="absolute top-0 -translate-x-1/2 rounded-md border border-n-neon/60 bg-n-raised px-2 py-0.5 font-mono text-[10px] font-medium text-n-neon"
                  style={{ left: `calc(${fill}% + ${9 - (fill / 100) * 18}px)` }}
                >
                  {days} days
                </span>
                <input
                  type="range"
                  min={3}
                  max={maxDays}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="n-range"
                  style={{ ['--fill' as string]: `${fill}%` }}
                  aria-label="Review window in days"
                  aria-valuetext={`${days} days`}
                />
                <div className="mt-1 flex justify-between px-[9px]" aria-hidden="true">
                  {Array.from({ length: maxDays - 2 }, (_, i) => i + 3).map((d) => (
                    <span
                      key={d}
                      className={`w-px ${d % 5 === 0 ? 'h-2' : 'h-1'} ${d <= days ? 'bg-n-neon/60' : 'bg-n-faint'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4" role="tablist" aria-label="Detail view">
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={on}
                    aria-controls="detail-tabpanel"
                    onClick={() => setTab(t.id)}
                    className={`flex items-center border-b pb-2.5 text-left ${
                      on ? 'border-b-2 border-n-neon' : 'border-n-line hover:border-n-faint'
                    }`}
                  >
                    <span className="mr-auto">
                      <span className={`block text-[13px] font-medium ${on ? 'text-n-neon' : ''}`}>{t.title}</span>
                      <span className="block text-[11px] text-n-muted">{t.sub}</span>
                    </span>
                    <NIcon name="chevron" size={14} className={on ? 'text-n-neon' : 'text-n-muted'} />
                  </button>
                );
              })}
            </div>

            <div id="detail-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-5">
              {tab === 'trend' && (
                <div className="n-chart w-full">
                  <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                      <CartesianGrid stroke={C.grid} vertical={false} />
                      <ReferenceArea
                        ifOverflow="hidden"
                        y1={gMin}
                        y2={gMax}
                        fill={C.green}
                        fillOpacity={0.06}
                        stroke={C.green}
                        strokeOpacity={0.3}
                        strokeDasharray="3 4"
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: C.muted, fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: C.line }}
                        minTickGap={24}
                      />
                      <YAxis
                        tick={{ fill: C.muted, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        width={44}
                      />
                      <Tooltip
                        cursor={{ stroke: NEON, strokeOpacity: 0.35 }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload as (typeof data)[number];
                          return (
                            <div className="rounded-lg border border-n-neon/60 bg-n-raised px-3 py-2 text-xs">
                              <p className="text-n-muted">{label}</p>
                              <p className="mt-0.5 font-display text-base" style={{ color: p.sev === 'green' ? C.text : SEV_TONE[p.sev].hex }}>
                                {withUnit(metric, p.value)}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={def.label}
                        stroke={NEON}
                        strokeWidth={2}
                        dot={(props: { cx?: number; cy?: number; payload?: { sev: Severity }; index?: number }) => {
                          const { cx, cy, payload, index } = props;
                          if (cx == null || cy == null || !payload) return <g key={index} />;
                          const off = payload.sev !== 'green';
                          return (
                            <circle
                              key={index}
                              cx={cx}
                              cy={cy}
                              r={off ? 3.5 : 2}
                              fill={off ? SEV_TONE[payload.sev].hex : C.bg}
                              stroke={off ? C.bg : NEON}
                              strokeWidth={off ? 1.5 : 1.25}
                            />
                          );
                        }}
                        activeDot={{ r: 5, fill: NEON, stroke: C.bg, strokeWidth: 2 }}
                        animationDuration={600}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-xs text-n-faint">
                    Safe range {gMin}–{gMax} {def.unit}. Coloured points are readings outside it.
                  </p>
                </div>
              )}

              {tab === 'range' && stats && (
                <div className="space-y-3">
                  {(['green', 'yellow', 'amber', 'red'] as const).map((sv) => {
                    const pct = (stats.counts[sv] / data.length) * 100;
                    return (
                      <div key={sv} className="grid grid-cols-[96px_1fr_72px] items-center gap-3 text-[13px]">
                        <span className="text-n-muted">{sv === 'green' ? 'In safe band' : SEV_SHORT[sv]}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-n-raised">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: SEV_TONE[sv].hex,
                              boxShadow: `0 0 10px ${SEV_TONE[sv].hex}`,
                            }}
                          />
                        </span>
                        <span className="text-right font-mono text-xs">
                          {stats.counts[sv]} · {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                  <p className="text-xs text-n-faint">
                    Safe range {gMin}–{gMax} {def.unit}, over the last {data.length} check-ins.
                  </p>
                </div>
              )}

              {tab === 'risk' && triage && (
                <div className="space-y-3 text-[13px]">
                  <p className="flex items-center gap-2 font-medium">
                    <SeverityPill severity={triage.severity} /> {triage.summary}
                  </p>
                  <p className="max-w-[70ch] leading-relaxed text-n-muted">{triage.why}</p>
                  <div className="flex flex-wrap gap-2">
                    {triage.hazards.map((h) => (
                      <span key={h} className="n-pill">
                        {h.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'countermeasure' && triage && (
                <ul className="grid gap-3 md:grid-cols-2">
                  {triage.actions.map((a) => (
                    <li key={a.id} className="rounded-[14px] border border-n-line bg-n-raised p-4">
                      <p className="flex items-center gap-2 text-[13px] font-medium">
                        <span className="n-pill">Tier {a.tier}</span>
                        {a.title}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-n-muted">{a.description}</p>
                    </li>
                  ))}
                  {triage.actions.length === 0 && <li className="text-[13px] text-n-muted">No action needed. Keep routine monitoring.</li>}
                </ul>
              )}

              {!latestRecord && <p className="text-[13px] text-n-muted">No check-ins yet.</p>}
            </div>
          </div>

          {/* Stat tiles */}
          {stats && (
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label="Change over period"
                pill={`${days}D`}
                value={`${stats.delta >= 0 ? '+' : '−'}${formatValue(metric, Math.abs(stats.delta))} ${def.unit.startsWith('/') ? '' : def.unit}`}
                sub="2nd half vs 1st"
              />
              <StatTile label={`${days}-day average`} pill={`${days}D`} value={withUnit(metric, stats.avg)} sub={`safe ${gMin}–${gMax}`} />
              <StatTile
                label="Days in safe range"
                pill={`${days}D`}
                value={`${((stats.counts.green / data.length) * 100).toFixed(1)}%`}
                sub={`${stats.counts.green} of ${data.length}`}
              />
              <StatTile
                label="Off-nominal streak"
                pill="Now"
                value={String(stats.streak)}
                sub={stats.streak === 1 ? 'check-in' : 'check-ins in a row'}
                tone={stats.streak >= 3 ? 'warn' : undefined}
              />
            </dl>
          )}
        </div>
      </section>
    </div>
  );
}

function SeverityPill({ severity }: { severity: Severity }) {
  if (severity === 'green') return <span className="n-pill border-n-green/50 bg-n-green/10 text-n-green">Nominal</span>;
  const t = SEV_TONE[severity];
  return (
    <span className={`n-pill ${t.text}`} style={{ borderColor: alpha(t.hex, 50), background: alpha(t.hex, 8) }}>
      {SEV_SHORT[severity]}
    </span>
  );
}

function IndicatorCard({ s, active, onSelect }: { s: IndicatorSummary; active: boolean; onSelect: () => void }) {
  const meta = METRIC_META[s.id];
  const def = INDICATORS[s.id];
  const tone = SEV_TONE[s.severity];
  const off = s.severity !== 'green';
  const deltaTone = off ? tone : SEV_TONE.green;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group flex min-w-0 flex-col gap-3 rounded-2xl border bg-n-panel px-[18px] pb-3.5 pt-[18px] text-left transition-[border-color,box-shadow] ${
        active ? 'n-glow border-n-neon/80' : `n-glow-soft ${tone.border} hover:border-n-neon/50`
      }`}
    >
      <span className="flex w-full items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-n-neon/50 bg-n-neon/[0.08] font-mono text-[11px] font-medium text-n-neon">
          {meta.glyph}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.06em] text-n-muted">{CATEGORY_LABEL[meta.category]}</span>
          <span className="block truncate text-sm font-medium">{def.label}</span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-n-faint group-hover:border-n-neon/60">
          <NIcon name="arrowUpRight" size={14} />
        </span>
      </span>
      <span className="text-xs text-n-muted">Latest reading</span>
      <span className="flex items-baseline gap-1.5 font-display">
        <span className="text-[40px] font-medium leading-none tracking-[-0.02em]">{formatValue(s.id, s.latest)}</span>
        <span className="text-lg text-n-muted">{def.unit}</span>
      </span>
      <span className={`flex items-center gap-1.5 font-mono text-[11px] ${deltaTone.text}`}>
        <span className={`h-3.5 w-3.5 rounded-full border-[1.5px] ${deltaTone.dot}`} />
        {s.deltaPct == null ? 'No prior data' : `${s.deltaPct >= 0 ? '+' : '−'}${Math.abs(s.deltaPct).toFixed(1)}% vs 7-check-in mean`}
      </span>
      <Sparkline series={s.series} color={off ? tone.hex : NEON} />
    </button>
  );
}

function StatTile({ label, pill, value, sub, tone }: { label: string; pill: string; value: string; sub: string; tone?: 'warn' }) {
  return (
    <div className={`space-y-3.5 rounded-[14px] border bg-n-raised p-4 ${tone === 'warn' ? 'border-n-amber/50' : 'border-n-line'}`}>
      <div className="flex items-center justify-between">
        <dt className="text-xs text-n-muted">{label}</dt>
        <span className="n-pill">{pill}</span>
      </div>
      <dd className="flex items-baseline gap-2">
        <span className={`font-display text-[30px] font-medium leading-none tracking-[-0.02em] ${tone === 'warn' ? 'text-n-amber' : ''}`}>
          {value.trim()}
        </span>
        <span className="font-mono text-[11px] text-n-muted">{sub}</span>
      </dd>
    </div>
  );
}
