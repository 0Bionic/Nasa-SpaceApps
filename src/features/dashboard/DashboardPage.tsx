import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { triageCheckIn } from '@/domain/triage/engine';
import { INDICATORS, INDICATOR_LIST } from '@/domain/indicators';
import { SEVERITY_RANK, type Severity } from '@/domain/types';
import { useAppStore } from '@/store/useAppStore';
import { BodyPlate } from '@/features/bodymap/BodyPlate';
import { RegionDetail } from '@/features/bodymap/RegionDetail';
import { AlertCard } from '@/components/AlertCard';
import { SeverityGlyph } from '@/components/SeverityBadge';
import { BandScale } from '@/components/BandScale';
import { IconExport } from '@/components/Icons';
import {
  ENVIRONMENT_LABEL,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  formatValue,
  indicatorValue,
  withUnit,
} from '@/components/vitals';
import { downloadGroundPacket } from '@/data/exportPacket';
import { MedicalDisclaimer } from '@/components/Disclaimer';
import { unusualChange } from '@/domain/triage/engine';
import type { HealthIndicatorId } from '@/domain/types';

function summarySentence(counts: Record<Severity, number>): string {
  const act = counts.red + counts.amber;
  const watch = counts.yellow;
  if (act === 0 && watch === 0) return 'All readings nominal.';
  const parts: string[] = [];
  if (act > 0) parts.push(`${act} require action`);
  if (watch > 0) parts.push(`${watch} caution`);
  return parts.join(' · ') + '.';
}

export function DashboardPage() {
  const latest = useAppStore((s) => s.latest);
  const history = useAppStore((s) => s.history);
  const profile = useAppStore((s) => s.profile);
  const selected = useAppStore((s) => s.selectedRegion);
  const setSelected = useAppStore((s) => s.setSelectedRegion);
  const criticalDismissed = useAppStore((s) => s.criticalBannerDismissed);
  const dismissCritical = useAppStore((s) => s.dismissCritical);

  const results = latest ? triageCheckIn(latest) : [];
  const alerts = results
    .filter((r) => r.severity !== 'green')
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const counts = results.reduce(
    (acc, r) => ({ ...acc, [r.severity]: acc[r.severity] + 1 }),
    { green: 0, yellow: 0, amber: 0, red: 0 } as Record<Severity, number>,
  );
  const worst = alerts[0];
  const previous = history[1];
  const changeWatch = latest
    ? (
        [
          'hr',
          'spo2',
          'mood',
          'sleep_h',
          'cabin_co2',
          'radiation_msv',
          'stress',
          'fatigue',
        ] as HealthIndicatorId[]
      ).filter((id) =>
        unusualChange(id, indicatorValue(latest, id) ?? 0, indicatorValue(previous, id)),
      )
    : [];

  // On narrow screens the detail panel sits below the map; bring it into view on selection.
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!selected || window.matchMedia('(min-width: 1024px)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    detailRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [selected]);

  const when = latest
    ? new Date(latest.timestamp).toLocaleString(undefined, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="space-y-8">
      {latest?.overallSeverity === 'red' && !criticalDismissed && worst && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded border border-nasa-red/45 bg-nasa-red/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex gap-3">
            <span className="mt-1.5">
              <SeverityGlyph severity="red" size={11} />
            </span>
            <div>
              <p className="font-semibold text-alert">
                {INDICATORS[worst.indicatorId].label} at {withUnit(worst.indicatorId, worst.value)} is past
                the critical limit
              </p>
              <p className="mt-0.5 text-sm text-alert-sub">
                Follow the steps below and prepare a packet for the ground flight surgeon.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 pl-6 sm:pl-0">
            <button type="button" className="btn-danger" onClick={() => downloadGroundPacket()}>
              <IconExport width={16} height={16} />
              Export ground packet
            </button>
            <button type="button" className="btn text-alert-sub hover:bg-star/5" onClick={dismissCritical}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {profile && (
            <p className="text-sm text-dust">
              {ENVIRONMENT_LABEL[profile.environment]}, {profile.name}
            </p>
          )}
          <h1 className="h-page mt-1">Mission day {profile?.missionDay ?? '–'}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/checkin" className="btn-primary">
            Start check-in
          </Link>
        </div>
      </header>

      {latest && (
        <section
          className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-4"
          aria-label="Habitat and radiation"
        >
          {(
            [
              ['spo2', 'Personal SpO₂'],
              ['cabin_co2', 'Cabin CO₂'],
              ['radiation_msv', 'Radiation dose'],
              ['stress', 'Stress'],
            ] as const
          ).map(([id, label]) => {
            const value = indicatorValue(latest, id);
            const r = results.find((x) => x.indicatorId === id);
            const sev = r?.severity ?? 'green';
            return (
              <div key={id} className="bg-hull px-4 py-3">
                <p className="text-xs text-dust">{label}</p>
                <p
                  className="readout mt-1 text-xl"
                  style={{ color: sev === 'green' ? 'rgb(var(--c-text))' : SEVERITY_COLOR[sev] }}
                >
                  {value != null ? formatValue(id, value) : '–'}
                  <span className="ml-1 text-xs font-normal text-faint">{INDICATORS[id].unit}</span>
                </p>
              </div>
            );
          })}
        </section>
      )}

      {changeWatch.length > 0 && (
        <div className="rounded border border-sev-yellow/40 bg-sev-yellow/10 px-3 py-2.5 text-sm text-dust">
          <p className="font-medium text-star">Change vs last check-in</p>
          <p className="mt-1">
            {changeWatch.map((id) => INDICATORS[id].label).join(', ')} shifted past the early-warning
            delta. Recheck or note in your next packet.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section className="surface relative p-4 sm:p-5" aria-labelledby="plate-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="plate-title" className="text-sm font-semibold text-star">
              Body status
            </h2>
            {when && <p className="text-xs text-faint">From the check-in on {when}</p>}
          </div>
          <div className="mx-auto mt-2 max-w-[640px]">
            <BodyPlate checkIn={latest} selected={selected} onSelect={setSelected} />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-rule pt-3 text-xs text-dust" aria-label="Legend">
            {(['green', 'yellow', 'amber', 'red'] as Severity[]).map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <SeverityGlyph severity={s} />
                {SEVERITY_LABEL[s]}
              </li>
            ))}
          </ul>
        </section>

        <section ref={detailRef} className="surface scroll-mt-20 p-5" aria-live="polite">
          {selected ? (
            <RegionDetail regionId={selected} checkIn={latest} onClose={() => setSelected(null)} />
          ) : (
            <div>
              <h2 className="h-section">
                {latest ? summarySentence(counts) : 'No check-in yet.'}
              </h2>
              <p className="mt-1.5 text-sm text-dust">
                {latest
                  ? 'Select an alert or a body region for detail.'
                  : 'No check-in yet. Use Check-in to log readings.'}
              </p>
              <div className="mt-5 space-y-2">
                {alerts.map((a, i) => (
                  <AlertCard key={a.indicatorId} result={a} defaultOpen={i === 0 && a.severity === 'red'} />
                ))}
              </div>
              {!latest && (
                <Link to="/checkin" className="btn-primary mt-5">
                  Start check-in
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {latest && (
        <section aria-labelledby="readings-title">
          <div className="flex items-baseline justify-between">
            <h2 id="readings-title" className="h-section">
              Latest readings
            </h2>
            <Link to="/" className="text-sm font-medium text-limb hover:underline">
              See trends
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-3">
            {INDICATOR_LIST.map((def) => {
              const value = indicatorValue(latest, def.id);
              const r = results.find((x) => x.indicatorId === def.id);
              const sev = r?.severity ?? 'green';
              return (
                <div key={def.id} className="bg-hull px-4 py-4">
                  <dt className="flex items-center justify-between text-xs text-dust">
                    {def.label}
                    {sev !== 'green' && <SeverityGlyph severity={sev} />}
                  </dt>
                  <dd className="mt-1.5">
                    <span
                      className="readout text-[1.75rem] leading-none"
                      style={{ color: sev === 'green' ? 'rgb(var(--c-text))' : SEVERITY_COLOR[sev] }}
                    >
                      {value != null ? formatValue(def.id, value) : '–'}
                    </span>
                    <span className="ml-1.5 text-xs text-faint">{def.unit}</span>
                  </dd>
                  <div className="mt-2.5">
                    <BandScale id={def.id} value={value} severity={sev} height={3} />
                  </div>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      <MedicalDisclaimer />
    </div>
  );
}
