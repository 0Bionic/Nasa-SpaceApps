import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { triageCheckIn, overallSeverity } from '@/domain/triage/engine';
import { forecast, forecastText, type Forecast } from '@/domain/forecast';
import { INDICATORS } from '@/domain/indicators';
import type { CheckInRecord, HealthIndicatorId, Severity } from '@/domain/types';
import { SeverityBadge } from '@/components/SeverityBadge';
import { INDICATOR_FIELD, withUnit } from '@/components/vitals';
import { ANALYTICS_METRICS, SEVERITY_RANK } from '@/features/trends/neon';

interface Member {
  name: string;
  role: string;
  simulated: boolean;
  history: CheckInRecord[]; // newest first
}

type Tweak = Partial<Record<keyof CheckInRecord, (v: number, dayIndex: number) => number>>;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Demo crewmates derived from the active crew member's own history with fixed,
 * deterministic offsets, so the board shows a realistic mix without fake medical records.
 */
const CREWMATES: { name: string; role: string; tweak: Tweak }[] = [
  {
    name: 'Dr. Lena Okafor',
    role: 'Flight Engineer (simulated)',
    tweak: {
      sleepH: (v) => clamp(v + 2, 3, 9),
      mood: (v) => clamp(v + 3, 1, 10),
      stress: (v) => clamp(v - 2, 1, 10),
      fatigue: (v) => clamp(v - 3, 1, 10),
      spo2: () => 98,
      cabinCo2Ppm: (v) => Math.min(v, 1800),
      teamwork: () => 8,
    },
  },
  {
    name: 'Mateo Ruiz',
    role: 'Mission Specialist, EVA lead (simulated)',
    tweak: {
      spo2: () => 97,
      cabinCo2Ppm: (v) => Math.min(v, 1800),
      dizziness: (_v, d) => (d < 3 ? 5 - d : 1), // recovering after a gravity transition
      resistiveMin: (_v, d) => (d % 2 ? 15 : 20),
      sleepH: (v) => clamp(v + 1.5, 3, 9),
      mood: (v) => clamp(v + 2, 1, 10),
    },
  },
  {
    name: 'Priya Nair',
    role: 'Payload Specialist (simulated)',
    tweak: {
      spo2: () => 97,
      cabinCo2Ppm: (v) => Math.min(v, 1800),
      teamwork: (_v, d) => clamp(4 + d * 0.5, 1, 10), // trending down over recent days
      stress: (_v, d) => clamp(7 - d * 0.4, 1, 10),
      sleepH: (v) => clamp(v + 1.8, 3, 9),
    },
  },
];

function applyTweak(history: CheckInRecord[], tweak: Tweak): CheckInRecord[] {
  return history.map((rec, d) => {
    const next = { ...rec } as CheckInRecord & Record<string, unknown>;
    for (const [key, fn] of Object.entries(tweak)) {
      const k = key as keyof CheckInRecord;
      next[k] = Number(fn!(rec[k] as number, d).toFixed(1)) as never;
    }
    next.symptoms = { sansVisualChanges: false, rash: false, orthostaticDizziness: false };
    next.regionDiscomfort = {};
    return next;
  });
}

function summarizeMember(m: Member) {
  const latest = m.history[0];
  if (!latest) return null;
  const results = triageCheckIn(latest);
  const overall: Severity = overallSeverity(results);
  const worst = results
    .filter((r) => r.severity !== 'green')
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
    .slice(0, 2);
  const warnings = ANALYTICS_METRICS.map((x) => x.id)
    .map((id): { id: HealthIndicatorId; f: Forecast } | null => {
      const series = m.history
        .slice(0, 7)
        .reverse()
        .map((c) => c[INDICATOR_FIELD[id]] as number);
      const f = forecast(id, series);
      return f && f.kind === 'leaving' ? { id, f } : null;
    })
    .filter((x): x is { id: HealthIndicatorId; f: Forecast } => x !== null);
  return { overall, worst, warnings };
}

/** CMO view: every crew member's status at a glance, worst first. */
export function CrewBoard() {
  const profile = useAppStore((s) => s.profile);
  const history = useAppStore((s) => s.history);

  const rows = useMemo(() => {
    if (!profile) return [];
    const members: Member[] = [
      { name: profile.name, role: `${profile.role} (you)`, simulated: false, history },
      ...CREWMATES.map((c) => ({ name: c.name, role: c.role, simulated: true, history: applyTweak(history, c.tweak) })),
    ];
    return members
      .map((m) => ({ m, s: summarizeMember(m) }))
      .filter((r): r is { m: Member; s: NonNullable<ReturnType<typeof summarizeMember>> } => r.s !== null)
      .sort((a, b) => SEVERITY_RANK[b.s.overall] - SEVERITY_RANK[a.s.overall] || b.s.warnings.length - a.s.warnings.length);
  }, [profile, history]);

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="crew-board" className="space-y-4">
      <div>
        <h2 id="crew-board" className="h-section">
          Crew board
        </h2>
        <p className="lede mt-1">
          The crew medical officer&rsquo;s view: everyone&rsquo;s latest status, worst first, with early warnings before a reading
          leaves range.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {rows.map(({ m, s }) => (
          <li key={m.name} className="surface space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-star">{m.name}</p>
                <p className="text-xs text-dust">{m.role}</p>
              </div>
              <SeverityBadge severity={s.overall} size="sm" />
            </div>
            {s.worst.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {s.worst.map((r) => (
                  <li key={r.indicatorId} className="flex justify-between gap-2">
                    <span className="text-dust">{INDICATORS[r.indicatorId].label}</span>
                    <span className="readout text-star">{withUnit(r.indicatorId, r.value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dust">All readings in range.</p>
            )}
            {s.warnings.slice(0, 2).map(({ id, f }) => (
              <p key={id} className="rounded-lg border border-sev-amber/40 bg-sev-amber/10 px-2.5 py-1.5 text-xs text-star">
                <span className="font-medium">{INDICATORS[id].label}: </span>
                {forecastText(id, f)}
              </p>
            ))}
            {!m.simulated && (
              <Link to="/" className="inline-block text-xs font-medium text-limb hover:underline">
                Open my analytics
              </Link>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-faint">
        Crewmates are simulated for the demo (derived from your own history with fixed offsets). In flight, each crew member&rsquo;s
        device would sync its packet to the CMO&rsquo;s tablet over the local network.
      </p>
    </section>
  );
}
