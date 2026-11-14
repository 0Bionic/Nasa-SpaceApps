import { BODY_REGIONS } from '@/domain/regions';
import { INDICATORS } from '@/domain/indicators';
import { HAZARDS } from '@/domain/hazards';
import { triageCheckIn, regionSeverity } from '@/domain/triage/engine';
import type { BodyRegionId, CheckInRecord } from '@/domain/types';
import { SeverityBadge } from '@/components/SeverityBadge';
import { HazardChips } from '@/components/HazardChips';
import { AlertCard } from '@/components/AlertCard';

interface Props {
  regionId: BodyRegionId;
  checkIn?: CheckInRecord | null;
  onClose: () => void;
}

export function RegionDetail({ regionId, checkIn, onClose }: Props) {
  const region = BODY_REGIONS[regionId];
  const results = checkIn ? triageCheckIn(checkIn) : [];
  const severity = checkIn
    ? regionSeverity(regionId, results, checkIn.symptoms)
    : 'green';
  const relevant = results.filter(
    (r) => region.indicators.includes(r.indicatorId) && r.severity !== 'green',
  );

  return (
    <aside className="panel animate-fade-up flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg tracking-wide text-white">{region.label}</p>
          <p className="mt-1 text-sm text-slate-400">{region.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={severity} />
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <p className="mb-3 text-sm text-slate-300">{region.functionNote}</p>
      <HazardChips hazards={region.hazards} />

      <div className="mt-4 space-y-2">
        <p className="label">Linked indicators</p>
        {region.indicators.map((id) => {
          const def = INDICATORS[id];
          const value = checkIn
            ? {
                hr: checkIn.hr,
                bp_sys: checkIn.bpSys,
                bp_dia: checkIn.bpDia,
                spo2: checkIn.spo2,
                temp: checkIn.temp,
                glucose: checkIn.glucose,
                sleep_h: checkIn.sleepH,
                mood: checkIn.mood,
                exercise_min: checkIn.exerciseMin,
              }[id]
            : null;
          return (
            <div
              key={id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-space-950/40 px-3 py-2 text-sm"
            >
              <span className="text-slate-300">{def.label}</span>
              <span className="font-semibold text-teal-soft">
                {value != null ? `${value} ${def.unit}` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {checkIn?.symptoms && (
        <div className="mt-4 space-y-1 text-xs text-slate-400">
          {checkIn.symptoms.sansVisualChanges && regionId === 'head_eyes' && (
            <p>Flag: SANS / visual changes reported</p>
          )}
          {checkIn.symptoms.rash && regionId === 'skin_immune' && (
            <p>Flag: Skin rash reported</p>
          )}
          {checkIn.symptoms.orthostaticDizziness &&
            (regionId === 'cardio' || regionId === 'msk') && (
              <p>Flag: Orthostatic dizziness reported</p>
            )}
        </div>
      )}

      <div className="mt-4 space-y-3 overflow-y-auto">
        {relevant.length === 0 ? (
          <p className="text-sm text-slate-400">
            No active alerts for this region. Hazards still to watch:{' '}
            {region.hazards.map((h) => HAZARDS[h].shortName).join(', ')}.
          </p>
        ) : (
          relevant.map((r) => <AlertCard key={r.indicatorId} result={r} />)
        )}
      </div>
    </aside>
  );
}
