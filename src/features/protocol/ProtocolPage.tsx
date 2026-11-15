import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { triageCheckIn } from '@/domain/triage/engine';
import { INDICATORS } from '@/domain/indicators';
import { MISSION_PROFILES } from '@/domain/mission';
import type { HealthIndicatorId, TriageResult } from '@/domain/types';
import { withUnit } from '@/components/vitals';
import { SeverityBadge } from '@/components/SeverityBadge';
import { downloadGroundPacket } from '@/data/exportPacket';
import { SEVERITY_RANK } from '@/features/trends/neon';
import { useTerm } from '@/app/audience';
import { useTextSize } from '@/app/textSize';

const RECHECK_SECONDS = 5 * 60;

function mmss(total: number) {
  const s = Math.max(0, Math.floor(total));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

interface Step {
  id: string;
  title: string;
  detail: string;
  tier?: number;
}

/**
 * Guided protocol for a critical or warning reading: an ordered, offline
 * checklist with an elapsed timer, a recheck countdown and a timestamped log.
 * Built for the Distance hazard, when the ground cannot answer in time.
 */
export function ProtocolPage() {
  const [params] = useSearchParams();
  const latest = useAppStore((s) => s.latest);
  const profile = useAppStore((s) => s.profile);
  const term = useTerm();
  const setTemporaryLarge = useTextSize((s) => s.setTemporary);

  // The guided protocol is used when someone is unwell: show it in large text,
  // without changing the saved choice for the rest of the app.
  useEffect(() => {
    setTemporaryLarge(true);
    return () => setTemporaryLarge(false);
  }, [setTemporaryLarge]);

  const target: TriageResult | null = useMemo(() => {
    if (!latest) return null;
    const results = triageCheckIn(latest).filter((r) => r.severity !== 'green');
    const wanted = params.get('metric');
    const picked = results.find((r) => r.indicatorId === wanted);
    return picked ?? [...results].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0] ?? null;
  }, [latest, params]);

  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState<Record<string, number>>({});
  const [recheckEnd, setRecheckEnd] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (!target) {
    return (
      <div className="space-y-4">
        <h1 className="h-page">Guided protocol</h1>
        <p className="lede">No reading in the latest check-in needs a protocol. Every indicator is nominal.</p>
        <Link to="/" className="btn-quiet">
          Back to Analytics
        </Link>
      </div>
    );
  }

  const id: HealthIndicatorId = target.indicatorId;
  const def = INDICATORS[id];
  const mission = profile ? MISSION_PROFILES[profile.environment] : null;
  const replySeconds = mission ? mission.delaySeconds * 2 : null;
  const steps: Step[] = [
    { id: 'stop', title: 'Stop and stabilise', detail: 'Pause the current task. Sit or anchor yourself, and tell a crewmate what is happening.' },
    { id: 'remeasure', title: `Re-measure ${def.label}`, detail: def.howToMeasure },
    ...target.actions
      .filter((a) => a.id !== 'ground_packet')
      .map((a) => ({ id: a.id, title: a.title, detail: a.description, tier: a.tier })),
    { id: 'recheck', title: 'Recheck after 5 minutes', detail: 'Start the timer below and re-measure when it ends. Escalate if it has not improved.' },
  ];

  const toggle = (sid: string) =>
    setDone((d) => {
      const next = { ...d };
      if (next[sid]) delete next[sid];
      else next[sid] = Date.now();
      return next;
    });

  const recheckLeft = recheckEnd ? (recheckEnd - now) / 1000 : null;
  const completed = steps.filter((s) => done[s.id]).length;
  const log = Object.entries(done)
    .sort((a, b) => a[1] - b[1])
    .map(([sid, t]) => ({ t, title: steps.find((s) => s.id === sid)?.title ?? (sid === 'packet' ? `${term('packetTitle')} sent` : sid) }));

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-nasa-red">Guided protocol</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="h-page">
            {def.label}: {withUnit(id, target.value)}
          </h1>
          <SeverityBadge severity={target.severity} />
        </div>
        <p className="lede">{target.why}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-4">
          <p className="text-xs text-dust">Elapsed</p>
          <p className="readout mt-1 font-display text-3xl" aria-live="off">
            {mmss((now - startedAt) / 1000)}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-xs text-dust">Progress</p>
          <p className="readout mt-1 font-display text-3xl">
            {completed}/{steps.length}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-xs text-dust">Earliest ground reply</p>
          <p className="readout mt-1 font-display text-3xl">{replySeconds == null ? '—' : replySeconds < 60 ? `${Math.ceil(replySeconds)} s` : `${Math.round(replySeconds / 60)} min`}</p>
          <p className="mt-1 text-xs text-dust">{replySeconds != null && replySeconds > 60 ? 'Act now; do not wait for the ground.' : 'Round-trip signal time only.'}</p>
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((s, i) => {
          const isDone = !!done[s.id];
          return (
            <li key={s.id} className={`surface flex gap-4 p-4 ${isDone ? 'opacity-70' : ''}`}>
              <input
                id={`step-${s.id}`}
                type="checkbox"
                checked={isDone}
                onChange={() => toggle(s.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-limb-deep"
              />
              <label htmlFor={`step-${s.id}`} className="min-w-0 flex-1 cursor-pointer">
                <span className="flex flex-wrap items-center gap-2 font-medium text-star">
                  <span className="readout text-dust">{i + 1}.</span>
                  <span className={isDone ? 'line-through' : ''}>{s.title}</span>
                  {s.tier && <span className="rounded-md border border-rule px-1.5 py-0.5 text-2xs text-dust">Tier {s.tier}</span>}
                  {isDone && <span className="readout text-xs text-sev-green">{new Date(done[s.id]).toLocaleTimeString()}</span>}
                </span>
                <span className="mt-1 block text-sm text-dust">{s.detail}</span>
              </label>
              {s.id === 'recheck' && (
                <div className="shrink-0 text-right">
                  {recheckLeft == null ? (
                    <button type="button" className="btn-quiet" onClick={() => setRecheckEnd(Date.now() + RECHECK_SECONDS * 1000)}>
                      Start 5:00
                    </button>
                  ) : recheckLeft > 0 ? (
                    <p className="readout font-display text-2xl" role="timer" aria-label="Recheck countdown">
                      {mmss(recheckLeft)}
                    </p>
                  ) : (
                    <p className="font-semibold text-nasa-red" role="alert">
                      Re-measure now
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            void downloadGroundPacket();
            setDone((d) => ({ ...d, packet: Date.now() }));
          }}
        >
          {term('packetExport')}
        </button>
        <Link to="/checkin" className="btn-quiet">
          Log the recheck
        </Link>
        <Link to={`/?metric=${id}`} className="text-sm font-medium text-limb hover:underline">
          See the trend
        </Link>
      </div>

      {log.length > 0 && (
        <section aria-labelledby="protocol-log">
          <h2 id="protocol-log" className="h-section">
            Event log
          </h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-dust">
            {log.map((e, i) => (
              <li key={i}>
                {new Date(e.t).toLocaleTimeString()} · {e.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
