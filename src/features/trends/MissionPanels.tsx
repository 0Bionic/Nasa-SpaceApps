import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { uplinkStatus, useUplinks } from '@/data/uplink';
import { HAZARDS } from '@/domain/hazards';
import { MISSION_PROFILES, type CompoundAlert } from '@/domain/mission';
import { SOURCES } from '@/domain/evidence';
import type { MissionEnvironment } from '@/domain/types';
import { NIcon, SEV_SHORT, SEV_TONE } from './neon';

/** Destination-specific context: gravity, signal delay, expected radiation background. */
export function MissionProfileStrip({ environment, avgDose }: { environment: MissionEnvironment; avgDose: number | null }) {
  const p = MISSION_PROFILES[environment];
  const base = p.radiationBaseline;
  return (
    <section aria-label="Mission profile" className="grid gap-px overflow-hidden rounded-2xl border border-n-line bg-n-line sm:grid-cols-2 xl:grid-cols-4">
      <Cell label="Mission profile" value={p.destination} sub={p.focus} />
      <Cell label="Gravity" value={p.gravity} sub="Drives bone, vestibular and fluid-shift risks" />
      <Cell label="Signal delay (one way)" value={p.delayLabel} sub={p.delaySeconds > 60 ? 'No real-time ground support' : 'Near real-time ground support'} />
      <Cell
        label="Radiation design limit (habitat)"
        value={p.designLimit}
        sub={`${avgDose != null ? `Yours ${avgDose.toFixed(2)} mSv/day · ` : ''}${
          base ? `unshielded ≈${base.msvPerDay} (${base.label}, ${SOURCES[base.source].org})` : p.radiationNote
        }`}
      />
    </section>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-n-panel px-4 py-3.5">
      <p className="text-xs text-n-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-medium">{value}</p>
      <p className="mt-0.5 text-xs leading-snug text-n-muted">{sub}</p>
    </div>
  );
}

/** Hazards that feed off one another (NASA HRP), detected across readings. */
export function CompoundAlertsPanel({ alerts }: { alerts: CompoundAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <section aria-labelledby="compound" className="n-card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <NIcon name="bolt" className="text-n-amber" />
        <h2 id="compound" className="text-lg font-medium">
          Compounding hazards
        </h2>
        <span className="n-pill">{alerts.length}</span>
        <span className="ml-auto text-xs text-n-muted">
          NASA: hazards &ldquo;can feed off one another&rdquo; ·{' '}
          <Link to="/guidance" className="text-n-neon hover:underline">
            method
          </Link>
        </span>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {alerts.map((a) => {
          const t = SEV_TONE[a.severity];
          return (
            <li key={a.id} className={`space-y-1.5 rounded-[14px] border p-4 ${a.severity === 'green' ? 'border-n-line' : t.border}`}>
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span className={t.text}>●</span>
                {a.title}
                <span className={`font-mono text-2xs uppercase ${t.text}`}>{SEV_SHORT[a.severity]}</span>
              </p>
              <p className="text-xs leading-relaxed text-n-muted">{a.detail}</p>
              <p className="text-xs">
                <span className="font-medium">Do: </span>
                {a.action}
              </p>
              <p className="flex flex-wrap gap-1.5 pt-0.5">
                {a.hazards.map((h) => (
                  <span key={h} className="n-pill">
                    {HAZARDS[h].shortName}
                  </span>
                ))}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Ground-packet uplinks in flight: transit time and earliest possible reply. */
export function UplinkQueue() {
  const uplinks = useUplinks((s) => s.uplinks).slice(0, 3);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (uplinks.length === 0) return null;
  const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const left = (t: number) => {
    const s = Math.max(0, Math.round((t - now) / 1000));
    return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  };
  return (
    <div className="space-y-1.5 border-t border-n-line pt-3">
      <p className="text-xs font-medium text-n-muted">Uplink queue</p>
      <ul className="space-y-1.5">
        {uplinks.map((u) => {
          const st = uplinkStatus(u, now);
          return (
            <li key={u.id} className="flex items-start justify-between gap-2 font-mono text-xs">
              <span className="text-n-muted">{time(u.sentAt)}</span>
              <span className={`text-right ${st === 'transit' ? 'text-n-amber' : st === 'awaiting-reply' ? 'text-n-neon' : 'text-n-green'}`}>
                {st === 'transit' && `In transit · arrives in ${left(u.arrivesAt)}`}
                {st === 'awaiting-reply' && `Delivered · reply ≥ ${left(u.earliestReplyAt)}`}
                {st === 'reply-window' && 'Delivered · reply window open'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Go / caution / no-go for EVA or rover driving, from the latest check-in. */
export function ReadinessCard({ status, reasons }: { status: 'go' | 'caution' | 'no-go'; reasons: { level: string; text: string }[] }) {
  const tone = status === 'go' ? SEV_TONE.green : status === 'caution' ? SEV_TONE.yellow : SEV_TONE.red;
  const label = status === 'go' ? 'GO' : status === 'caution' ? 'CAUTION' : 'NO-GO';
  return (
    <section aria-labelledby="readiness" className="n-card flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
      <div className="shrink-0">
        <p className="text-xs text-n-muted">EVA &amp; vehicle readiness</p>
        <p id="readiness" className={`font-display text-3xl font-semibold ${tone.text}`}>
          {label}
        </p>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 text-sm">
        {reasons.length === 0 ? (
          <p className="text-n-muted">Oxygen, balance, fatigue, sleep, temperature, heart rate and blood pressure are all nominal.</p>
        ) : (
          <ul className="space-y-1">
            {reasons.slice(0, 4).map((r) => (
              <li key={r.text} className="flex gap-2">
                <span className={r.level === 'no-go' ? SEV_TONE.red.text : SEV_TONE.yellow.text}>●</span>
                {r.text}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-n-muted">
          App heuristic from the latest check-in, for NASA&rsquo;s spacewalk and sensorimotor risks. The flight surgeon makes the
          real call.
        </p>
      </div>
    </section>
  );
}
