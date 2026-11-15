import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTerm } from '@/app/audience';
import { SeverityBadge, SeverityGlyph } from '@/components/SeverityBadge';
import { EARTH_DELAY, SEVERITY_COLOR, alpha } from '@/components/vitals';
import { SOURCES, type SourceId } from '@/domain/evidence';
import { severityFor } from '@/domain/triage/engine';
import { MISSION_PROFILES } from '@/domain/mission';
import {
  HR_MAX,
  ASSUMED_AGE,
  MODE_INFO,
  QUALITY_MIN,
  formatDuration,
  hrSeverity,
  spo2Severity,
  type MonitorMode,
  type MonitorSample,
  type MonitorSession,
} from '@/domain/monitoring';
import { actigraphyNights } from '@/data/monitorSim';
import { deleteMonitorSession, listMonitorSessions } from '@/data/monitorRepo';
import { downloadGroundPacket } from '@/data/exportPacket';
import { summarizeSpaceWeather, useSpaceWeather } from '@/data/spaceWeather';
import { C, NEON, NIcon } from '@/features/trends/neon';
import { useLiveMonitor, type Speed } from './useLiveMonitor';

const WINDOW = 120;

/* ------------------------------------------------------------------ */
/* Live trace                                                          */
/* ------------------------------------------------------------------ */

function LiveTrace({
  samples,
  pick,
  lo,
  hi,
  color,
  refs,
  label,
  slots = WINDOW,
}: {
  samples: MonitorSample[];
  pick: (s: MonitorSample) => number | null;
  lo: number;
  hi: number;
  color: string;
  refs: { v: number; label: string; color: string }[];
  label: string;
  slots?: number;
}) {
  const W = 600;
  const H = 120;
  const x = (i: number) => W - (samples.length - 1 - i) * (W / (slots - 1));
  const y = (v: number) => 6 + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - 12);

  // Break the line wherever the signal is unusable, and mark those samples as artifact.
  const segments: string[] = [];
  let d = '';
  const artifacts: number[] = [];
  samples.forEach((s, i) => {
    const v = pick(s);
    if (v == null || s.quality < QUALITY_MIN) {
      if (d) segments.push(d);
      d = '';
      artifacts.push(i);
      return;
    }
    d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (d) segments.push(d);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[120px] w-full" role="img" aria-label={label}>
      {refs.map((r) => (
        <g key={r.label}>
          <line x1={0} x2={W} y1={y(r.v)} y2={y(r.v)} stroke={r.color} strokeOpacity={0.6} strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      {artifacts.map((i) => (
        <rect key={i} x={x(i) - 2} y={0} width={4} height={H} fill={C.dim} fillOpacity={0.25} />
      ))}
      {segments.map((p, i) => (
        <g key={i}>
          <path d={p} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={6} vectorEffect="non-scaling-stroke" />
          <path d={p} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}

function RefLegend({ refs }: { refs: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-n-muted">
      {refs.map((r) => (
        <span key={r.label} className="inline-flex items-center gap-1.5">
          <svg width="16" height="4" aria-hidden="true">
            <line x1="0" x2="16" y1="2" y2="2" stroke={r.color} strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          {r.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-1.5 rounded-sm" style={{ background: alpha(C.dim, 45) }} />
        Artifact / no signal (ignored)
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Readouts                                                            */
/* ------------------------------------------------------------------ */

function Readout({
  label,
  value,
  unit,
  severity,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  severity?: ReturnType<typeof severityFor>;
  sub?: string;
}) {
  const color = severity ? SEVERITY_COLOR[severity] : undefined;
  return (
    <div
      className="rounded-xl border px-3 py-2.5"
      style={{ borderColor: color ? alpha(color, 45) : 'rgb(var(--c-line))', background: color ? alpha(color, 6) : undefined }}
    >
      <p className="flex items-center gap-1.5 text-[11px] text-n-muted">
        {severity && <SeverityGlyph severity={severity} size={8} />}
        {label}
      </p>
      <p className="mt-0.5 font-display text-2xl font-medium tabular-nums" style={{ color }}>
        {value}
        <span className="ml-1 text-xs font-normal text-n-muted">{unit}</span>
      </p>
      {sub && <p className="text-[11px] text-n-muted">{sub}</p>}
    </div>
  );
}

const ACTIVITY_LABEL = { sleep: 'Asleep', rest: 'Resting', active: 'Active', exertion: 'Hard effort' } as const;

function clockFromStart(startIso: string | null, t: number) {
  if (!startIso) return '';
  return new Date(new Date(startIso).getTime() + t * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------------ */
/* Live session                                                        */
/* ------------------------------------------------------------------ */

function LiveSession({ onSaved }: { onSaved: () => void }) {
  const live = useLiveMonitor();
  const profile = useAppStore((s) => s.profile);
  const [mode, setMode] = useState<MonitorMode>(live.mode);
  const [speed, setSpeed] = useState<Speed>(live.speed);
  const running = live.status === 'running';
  const activeMode = running ? live.mode : mode;
  const info = MODE_INFO[activeMode];
  const delay = profile ? EARTH_DELAY[profile.environment] : null;
  const s = live.current;
  const usable = s != null && s.quality >= QUALITY_MIN && s.hr != null;

  const hrRefs =
    activeMode === 'ambulatory'
      ? [
          { v: 90, label: 'Resting HR upper limit 90 bpm', color: SEVERITY_COLOR.yellow },
          { v: Math.round(HR_MAX * 0.85), label: `Exertion ceiling ${Math.round(HR_MAX * 0.85)} bpm (85% max)`, color: SEVERITY_COLOR.amber },
        ]
      : [
          { v: Math.round(HR_MAX * 0.85), label: `85% max ${Math.round(HR_MAX * 0.85)} bpm`, color: SEVERITY_COLOR.yellow },
          { v: Math.round(HR_MAX * 0.95), label: `95% max ${Math.round(HR_MAX * 0.95)} bpm`, color: SEVERITY_COLOR.amber },
        ];
  const spo2Refs = [
    { v: 95.5, label: 'Below 96% caution', color: SEVERITY_COLOR.yellow },
    { v: 89.5, label: 'Below 90% hypoxaemia (WHO)', color: SEVERITY_COLOR.red },
  ];

  const stop = async () => {
    await live.stop();
    onSaved();
  };

  const worstNow =
    live.hrActive === 'red' || live.spo2Active === 'red'
      ? 'red'
      : live.hrActive === 'amber' || live.spo2Active === 'amber'
        ? 'amber'
        : null;
  const lastHealth = [...live.events].reverse().find((e) => e.kind === 'health' && e.severity !== 'green');

  return (
    <section aria-labelledby="live" className="n-card space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <NIcon name="signal" className="text-n-neon" />
        <h2 id="live" className="text-[15px] font-medium">
          Live monitoring session
        </h2>
        {running ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-n-red/50 bg-n-red/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-n-red">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-n-red" /> Recording
          </span>
        ) : (
          <span className="n-pill">On-device alerts</span>
        )}
        <span className="n-pill">Simulated sensors</span>
      </div>

      {!running && (
        <div className="space-y-3">
          <div className="seg" role="group" aria-label="Session type">
            {(Object.keys(MODE_INFO) as MonitorMode[]).map((m) => (
              <button key={m} type="button" className="seg-item" aria-pressed={mode === m} onClick={() => setMode(m)}>
                {MODE_INFO[m].label}
              </button>
            ))}
          </div>
          <p className="max-w-[70ch] text-sm text-n-muted">{info.description}</p>
          <p className="max-w-[70ch] border-l-2 border-n-neon/50 pl-3 text-[13px]">
            {info.basis} <Cite ids={info.sources} />
          </p>
          {mode === 'ambulatory' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-n-muted">Playback speed (demo)</span>
              <div className="seg" role="group" aria-label="Playback speed">
                {([1, 60, 600] as Speed[]).map((v) => (
                  <button key={v} type="button" className="seg-item" aria-pressed={speed === v} onClick={() => setSpeed(v)}>
                    {v === 1 ? 'Real time' : `${v}×`}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-n-muted">
                {speed === 600 ? 'A full day in about 2.5 minutes' : speed === 60 ? 'A full day in 24 minutes' : 'Records for 24 hours'}
              </span>
            </div>
          )}
          <button type="button" className="n-btn" onClick={() => live.start(mode, mode === 'ambulatory' ? speed : 1)}>
            Start {mode === 'ambulatory' ? '24-hour' : MODE_INFO[mode].label} session
          </button>
        </div>
      )}

      {running && (
        <>
          {worstNow && lastHealth && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border p-3"
              style={{ borderColor: alpha(SEVERITY_COLOR[worstNow], 60), background: alpha(SEVERITY_COLOR[worstNow], 10) }}
            >
              <SeverityGlyph severity={worstNow} size={12} />
              <div className="text-sm">
                <p className="font-medium" style={{ color: SEVERITY_COLOR[worstNow] }}>
                  {lastHealth.message}
                </p>
                <p className="text-[12px] text-n-muted">
                  Raised on this device in under 10 s. {delay ? `The ground would see it after ${delay.value} each way.` : ''}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <span className="font-medium">{MODE_INFO[live.mode].label}</span>
            <span className="font-mono tabular-nums text-n-muted">{formatDuration(live.elapsedS)}</span>
            {live.mode === 'ambulatory' && (
              <span className="text-n-muted">
                Sim clock {clockFromStart(live.startedAt, live.elapsedS)}
                {live.speed > 1 && ` · ${live.speed}×`}
              </span>
            )}
            {s && <span className="text-n-muted">{ACTIVITY_LABEL[s.activity]}</span>}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Readout
              label="Heart rate"
              value={usable ? String(s!.hr) : '--'}
              unit="bpm"
              severity={usable ? hrSeverity(s!.hr!, s!.activity) : undefined}
              sub={usable && s!.activity !== 'rest' && s!.activity !== 'sleep' ? `${Math.round((s!.hr! / HR_MAX) * 100)}% of max` : undefined}
            />
            <Readout
              label="SpO₂"
              value={usable && s!.spo2 != null ? String(s!.spo2) : '--'}
              unit="%"
              severity={usable && s!.spo2 != null ? spo2Severity(s!.spo2) : undefined}
            />
            <Readout label="Breathing" value={s ? String(s.resp) : '--'} unit="/min" />
            <Readout
              label="Signal quality"
              value={s ? String(Math.round(s.quality * 100)) : '--'}
              unit="%"
              severity={live.signalLost ? 'yellow' : undefined}
              sub={live.signalLost ? 'Signal lost: check contact' : usable ? 'Good contact' : 'Artifact, ignored'}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[13px] font-medium">Heart rate</p>
            <LiveTrace samples={live.window} pick={(x) => x.hr} lo={40} hi={200} color={NEON} refs={hrRefs} label="Live heart rate trace" />
            <RefLegend refs={hrRefs} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium">SpO₂</p>
            <LiveTrace
              samples={live.window}
              pick={(x) => x.spo2}
              lo={80}
              hi={100}
              color={C.green}
              refs={spo2Refs}
              label="Live SpO₂ trace"
            />
            <RefLegend refs={spo2Refs} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="n-btn" onClick={() => void stop()}>
              Stop and save
            </button>
            <button type="button" className="n-btn-ghost" onClick={live.discard}>
              Discard
            </button>
            <span className="mx-1 hidden h-5 w-px bg-n-line sm:inline-block" />
            <span className="text-[11px] text-n-muted">Demo events:</span>
            <button type="button" className="rounded-lg border border-n-line px-2.5 py-1 text-[12px] hover:border-n-neon/60" onClick={() => live.inject('tachy')}>
              High heart rate
            </button>
            <button type="button" className="rounded-lg border border-n-line px-2.5 py-1 text-[12px] hover:border-n-neon/60" onClick={() => live.inject('desat')}>
              SpO₂ drop
            </button>
            <button type="button" className="rounded-lg border border-n-line px-2.5 py-1 text-[12px] hover:border-n-neon/60" onClick={() => live.inject('dropout')}>
              Sensor dropout
            </button>
          </div>

          <EventLog events={live.events} startIso={live.startedAt} mode={live.mode} />
        </>
      )}

      {!running && live.lastSaved && (
        <p className="text-[13px] text-n-muted">
          Saved {MODE_INFO[live.lastSaved.mode].label} session ({formatDuration(live.lastSaved.durationS)}). It is queued for the next ground packet.
        </p>
      )}

      <p className="text-[11px] text-n-muted">
        Exertion ceiling uses age-predicted max HR (220 − age, age {ASSUMED_AGE} assumed: {HR_MAX} bpm), an app heuristic, not a NASA limit.
        At rest and during sleep the check-in resting bands apply. An alert needs several good samples in a row, so a single spike or motion
        artifact never triggers one.
      </p>
    </section>
  );
}

function EventLog({ events, startIso, mode }: { events: MonitorSession['events']; startIso: string | null; mode: MonitorMode }) {
  if (events.length === 0) return <p className="text-[13px] text-n-muted">No alerts yet.</p>;
  return (
    <ol className="max-h-56 space-y-1.5 overflow-y-auto pr-1" aria-label="Alert log">
      {[...events].reverse().map((e, i) => (
        <li key={`${e.t}-${i}`} className="flex items-start gap-2.5 text-[13px]">
          <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums text-n-muted">
            {mode === 'ambulatory' ? clockFromStart(startIso, e.t) : formatDuration(e.t)}
          </span>
          <span className="mt-1">
            <SeverityGlyph severity={e.severity} size={8} />
          </span>
          <span className={e.kind === 'signal' ? 'text-n-muted' : ''}>{e.message}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Recorded sessions (store-and-forward)                               */
/* ------------------------------------------------------------------ */

function SessionCard({ s, onDelete }: { s: MonitorSession; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const when = new Date(s.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const alerts = s.events.filter((e) => e.kind === 'health' && e.severity !== 'green').length;
  return (
    <li className="rounded-xl border border-n-line p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{MODE_INFO[s.mode].label}</span>
        <span className="text-[12px] text-n-muted">
          {when} · {formatDuration(s.durationS)}
        </span>
        <SeverityBadge severity={s.worstSeverity} size="sm" />
        <span className={`ml-auto n-pill ${s.downlinked ? '' : '!border-n-amber/50 !bg-n-amber/10 !text-n-amber'}`}>
          {s.downlinked ? 'Sent to ground' : 'Queued for downlink'}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-4">
        <span>
          <span className="text-n-muted">HR </span>
          {s.stats.hr ? `${s.stats.hr.min}–${s.stats.hr.max} bpm (avg ${Math.round(s.stats.hr.mean)})` : '--'}
        </span>
        <span>
          <span className="text-n-muted">SpO₂ </span>
          {s.stats.spo2 ? `${s.stats.spo2.min}–${s.stats.spo2.max}%` : '--'}
        </span>
        <span>
          <span className="text-n-muted">Usable signal </span>
          {s.stats.goodPct}% · {s.stats.dropouts} dropout{s.stats.dropouts === 1 ? '' : 's'}
        </span>
        <span>
          <span className="text-n-muted">Alerts </span>
          {alerts}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" className="rounded-lg border border-n-line px-2.5 py-1 text-[12px] hover:border-n-neon/60" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide recording' : 'View recording'}
        </button>
        <button type="button" className="rounded-lg border border-n-line px-2.5 py-1 text-[12px] text-n-muted hover:border-n-red/60 hover:text-n-red" onClick={onDelete}>
          Delete
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          <LiveTrace samples={s.samples} pick={(x) => x.hr} lo={40} hi={200} color={NEON} refs={[]} label="Recorded heart rate" slots={Math.max(2, s.samples.length)} />
          <LiveTrace samples={s.samples} pick={(x) => x.spo2} lo={80} hi={100} color={C.green} refs={[]} label="Recorded SpO₂" slots={Math.max(2, s.samples.length)} />
          <EventLog events={s.events} startIso={s.startedAt} mode={s.mode} />
        </div>
      )}
    </li>
  );
}

function RecordedSessions({ sessions, reload }: { sessions: MonitorSession[]; reload: () => void }) {
  const term = useTerm();
  const queued = sessions.filter((s) => !s.downlinked).length;
  return (
    <section aria-labelledby="recorded" className="n-card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <NIcon name="upload" className="text-n-neon" />
        <h2 id="recorded" className="text-[15px] font-medium">
          Recorded sessions
        </h2>
        <span className="n-pill">Store and forward</span>
        {queued > 0 && (
          <button type="button" className="n-btn ml-auto" onClick={() => void downloadGroundPacket().then(reload)}>
            {term('exportPacket')} ({queued} queued)
          </button>
        )}
      </div>
      <p className="max-w-[70ch] text-[13px] text-n-muted">
        Sessions are kept on this device and go out with the next ground packet, then marked as sent. CSA Bio-Monitor works the same way,
        and the NASA–CSA HERA study found recording on the device lasted a full day where live streaming did not.{' '}
        <Cite ids={['csa-biomonitor', 'nasa-hera-astroskin']} />
      </p>
      {sessions.length === 0 ? (
        <p className="text-[13px] text-n-muted">No sessions yet. Start one above.</p>
      ) : (
        <ul className="space-y-2.5">
          {sessions.map((s) => (
            <SessionCard key={s.id} s={s} onDelete={() => void deleteMonitorSession(s.id).then(reload)} />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sleep (actigraphy)                                                  */
/* ------------------------------------------------------------------ */

function SleepCard() {
  const profile = useAppStore((s) => s.profile);
  const latest = useAppStore((s) => s.latest);
  if (!profile) return null;
  const nights = actigraphyNights(profile.missionDay);
  const last = nights[nights.length - 1];
  if (!last) return null;
  const sev = severityFor('sleep_h', last.totalSleepH);
  const maxH = 10;
  const onset = new Date(2000, 0, 1, 18, last.onsetMin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const peak = Math.max(...last.epochs);

  return (
    <section aria-labelledby="sleep" className="n-card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <NIcon name="clock" className="text-n-neon" />
        <h2 id="sleep" className="text-[15px] font-medium">
          Sleep
        </h2>
        <span className="n-pill">Actigraphy · continuous</span>
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="text-[11px] text-n-muted">Last night (day {last.missionDay})</p>
          <p className="font-display text-3xl font-medium tabular-nums" style={{ color: SEVERITY_COLOR[sev] }}>
            {last.totalSleepH}
            <span className="ml-1 text-sm font-normal text-n-muted">h</span>
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-5 text-[12px]">
          <div>
            <dt className="text-n-muted">Asleep at</dt>
            <dd>{onset}</dd>
          </div>
          <div>
            <dt className="text-n-muted">Efficiency</dt>
            <dd>{last.efficiencyPct}%</dd>
          </div>
          <div>
            <dt className="text-n-muted">Awakenings</dt>
            <dd>{last.awakenings}</dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="mb-1 text-[11px] text-n-muted">Movement through the night (10-min epochs)</p>
        <div className="flex h-10 items-end gap-px" aria-hidden="true">
          {last.epochs.map((v, i) => (
            <span key={i} className="flex-1 rounded-t-sm" style={{ height: `${Math.max(6, (v / peak) * 100)}%`, background: v > 55 ? SEVERITY_COLOR.amber : alpha(NEON, 55) }} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[11px] text-n-muted">Last {nights.length} nights</p>
        <div className="flex h-20 items-end gap-1.5">
          {nights.map((n) => {
            const sv = severityFor('sleep_h', n.totalSleepH);
            return (
              <div key={n.missionDay} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-n-muted">{n.totalSleepH}</span>
                <span className="w-full rounded-t" style={{ height: `${(n.totalSleepH / maxH) * 56}px`, background: alpha(SEVERITY_COLOR[sv], 70) }} />
                <span className="text-[10px] text-n-muted">D{n.missionDay}</span>
              </div>
            );
          })}
        </div>
      </div>

      {latest && (
        <p className="text-[12px] text-n-muted">
          Self-reported in today&rsquo;s check-in: <span className="text-n-text">{latest.sleepH} h</span>
          {Math.abs(latest.sleepH - last.totalSleepH) >= 1 && ' · differs from the sensor by an hour or more; worth raising at the next private medical conference.'}
        </p>
      )}
      <p className="text-[11px] text-n-muted">
        NASA&rsquo;s medical standard schedules objective sleep measurement continuously through the mission, with data discussed at the weekly
        private medical conference. Bands: 7 h or more (AASM). Simulated wrist sensor. <Cite ids={['ochmo-100']} />
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Radiation dosimeter                                                 */
/* ------------------------------------------------------------------ */

function DoseCard() {
  const profile = useAppStore((s) => s.profile);
  const latest = useAppStore((s) => s.latest);
  const weather = useSpaceWeather((s) => s.data);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!profile) return null;

  const mission = MISSION_PROFILES[profile.environment];
  const perDay = mission.radiationBaseline?.msvPerDay ?? latest?.radiationMsv ?? 0.35;
  const basis = mission.radiationBaseline ? mission.radiationBaseline.label : 'latest check-in dose';
  const rate = (perDay * 1000) / 24; // µSv/h
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const hours = (now - midnight.getTime()) / 3600000;
  const today = (rate * hours) / 1000; // mSv
  const wobble = 1 + 0.03 * Math.sin(now / 7000);
  const sw = weather ? summarizeSpaceWeather(weather) : null;
  const sev = severityFor('radiation_msv', perDay);

  return (
    <section aria-labelledby="dose" className="n-card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <NIcon name="bolt" className="text-n-neon" />
        <h2 id="dose" className="text-[15px] font-medium">
          Radiation dosimeter
        </h2>
        <span className="n-pill">Personal dosimetry · continuous</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Readout label="Dose rate now" value={(rate * wobble).toFixed(1)} unit="µSv/h" severity={sev} />
        <Readout label="Since midnight" value={today.toFixed(3)} unit="mSv" sub={`Projected ${perDay.toFixed(2)} mSv today`} />
      </div>
      <p className="text-[12px] text-n-muted">
        Rate from {basis}. NASA habitat design limit here: <span className="text-n-text">{mission.designLimit}</span>.
      </p>
      {sw?.alert && (
        <p role="status" className="rounded-lg border border-n-amber/50 bg-n-amber/10 px-3 py-2 text-[12px] text-n-amber">
          {sw.alert === 'sep' ? 'Solar particle event in the last 3 days' : 'X-class flare in the last 3 days'} (NASA DONKI): watch this
          dosimeter and be ready to shelter.
        </p>
      )}
      <p className="text-[11px] text-n-muted">
        NASA requires radiation to be monitored throughout the mission with crew personal dosimetry. Simulated dosimeter.{' '}
        <Cite ids={['ochmo-100', 'csa-radiation']} />
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

function Cite({ ids }: { ids: SourceId[] }) {
  return (
    <span className="whitespace-normal">
      {ids.map((id, i) => {
        const s = SOURCES[id];
        return (
          <span key={id}>
            {i > 0 && ' · '}
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer" className="text-n-neon hover:underline">
                {s.org.split(' (')[0]}
              </a>
            ) : (
              s.org
            )}
          </span>
        );
      })}
    </span>
  );
}

const WHY: { title: string; body: string; ids: SourceId[] }[] = [
  {
    title: 'Not 24/7 vitals',
    body: 'On the ISS, routine health checks are periodic: a weekly private medical conference and occasional vital-sign checks. NASA notes that trending vitals has not shown abnormalities and recommends testing based on symptoms. That is your daily check-in.',
    ids: ['ochmo-100'],
  },
  {
    title: 'Live where it counts',
    body: 'After the first four Shuttle flights, routine ECG was done only during EVA. Today NASA monitors ECG and heart rate on every EVA, and heart rate during exercise.',
    ids: ['nasa-cardiac-evidence', 'nasa-hr-sensor'],
  },
  {
    title: 'Onboard, not on the ground',
    body: 'ISS live monitoring relies on the ground. NASA says exploration missions need it onboard, which is why every alert here runs on this device.',
    ids: ['nasa-telemed'],
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function MonitorPage() {
  const [sessions, setSessions] = useState<MonitorSession[]>([]);
  const reload = useCallback(() => {
    void listMonitorSessions().then(setSessions);
  }, []);
  useEffect(() => {
    reload();
    window.addEventListener('aether:downlinked', reload);
    return () => window.removeEventListener('aether:downlinked', reload);
  }, [reload]);

  return (
    <div className="space-y-5 font-ui">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-n-neon">Continuous monitoring</p>
        <h1 className="h-page">Monitor</h1>
        <p className="lede">
          Continuous sensing where NASA and CSA actually use it: live during EVA and exercise, full-day recording sessions, sleep and
          radiation. Everything else stays in the daily check-in.
        </p>
      </header>

      <LiveSession onSaved={reload} />

      <div className="grid gap-5 lg:grid-cols-2">
        <SleepCard />
        <DoseCard />
      </div>

      <RecordedSessions sessions={sessions} reload={reload} />

      <section aria-labelledby="why" className="space-y-3">
        <h2 id="why" className="h-section">
          Why monitoring is scoped this way
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-2xl border border-n-line p-4">
              <h3 className="text-sm font-semibold">{w.title}</h3>
              <p className="mt-1.5 text-[13px] text-n-muted">{w.body}</p>
              <p className="mt-2 text-[11px]">
                <Cite ids={w.ids} />
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
