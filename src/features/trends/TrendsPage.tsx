import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';

type MetricKey = 'hr' | 'bpSys' | 'spo2' | 'sleepH' | 'mood' | 'temp';

const METRICS: { key: MetricKey; label: string; color: string; greenMin: number; greenMax: number }[] = [
  { key: 'hr', label: 'Heart rate', color: '#2dd4bf', greenMin: 50, greenMax: 90 },
  { key: 'bpSys', label: 'Systolic BP', color: '#38bdf8', greenMin: 100, greenMax: 130 },
  { key: 'spo2', label: 'SpO₂', color: '#a3e635', greenMin: 96, greenMax: 100 },
  { key: 'sleepH', label: 'Sleep hours', color: '#c084fc', greenMin: 6.5, greenMax: 9 },
  { key: 'mood', label: 'Mood', color: '#f472b6', greenMin: 7, greenMax: 10 },
  { key: 'temp', label: 'Temp °C', color: '#fb923c', greenMin: 36.1, greenMax: 37.2 },
];

export function TrendsPage() {
  const history = useAppStore((s) => s.history);
  const [days, setDays] = useState<7 | 30>(30);
  const [metric, setMetric] = useState<MetricKey>('sleepH');

  const meta = METRICS.find((m) => m.key === metric)!;

  const data = useMemo(() => {
    const slice = [...history].reverse().slice(-days);
    return slice.map((c) => ({
      day: new Date(c.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      hr: c.hr,
      bpSys: c.bpSys,
      spo2: c.spo2,
      sleepH: c.sleepH,
      mood: c.mood,
      temp: c.temp,
      severity: c.overallSeverity,
    }));
  }, [history, days]);

  const anomalies = useMemo(() => {
    let streak = 0;
    let lastLabel = '';
    for (const row of data) {
      const v = row[metric];
      if (v < meta.greenMin || v > meta.greenMax) {
        streak += 1;
        lastLabel = row.day;
      } else {
        streak = 0;
      }
    }
    return streak >= 3
      ? `Persistent deviation: ${meta.label} outside green band for ${streak} consecutive days (ending ${lastLabel}).`
      : null;
  }, [data, metric, meta]);

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Trends</h1>
        <p className="mt-1 text-sm text-slate-400">
          Longitudinal indicators with green-band reference — spot slow declines before they become critical.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[7, 30].map((d) => (
          <button
            key={d}
            type="button"
            className={days === d ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setDays(d as 7 | 30)}
          >
            {d} days
          </button>
        ))}
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={metric === m.key ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {anomalies && (
        <div className="rounded-xl border border-status-amber/40 bg-status-amber/10 px-4 py-3 text-sm text-status-amber">
          {anomalies}
        </div>
      )}

      <div className="panel p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm tracking-widest text-teal-soft">{meta.label}</h2>
          <p className="text-xs text-slate-500">
            Green band {meta.greenMin}–{meta.greenMax}
          </p>
        </div>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  background: '#0a1628',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Legend />
              <ReferenceArea
                y1={meta.greenMin}
                y2={meta.greenMax}
                fill="#22c55e"
                fillOpacity={0.08}
              />
              <Line
                type="monotone"
                dataKey={metric}
                name={meta.label}
                stroke={meta.color}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                animationDuration={700}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
