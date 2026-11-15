import { BODY_REGIONS } from '@/domain/regions';
import { INDICATORS } from '@/domain/indicators';
import { HAZARDS } from '@/domain/hazards';
import { regionSeverity, severityFor, triageCheckIn } from '@/domain/triage/engine';
import type { BodyRegionId, CheckInRecord } from '@/domain/types';
import { SeverityBadge } from '@/components/SeverityBadge';
import { AlertCard } from '@/components/AlertCard';
import { BandScale } from '@/components/BandScale';
import { IconClose } from '@/components/Icons';
import { SEVERITY_COLOR, formatValue, indicatorValue } from '@/components/vitals';

interface Props {
  regionId: BodyRegionId;
  checkIn?: CheckInRecord | null;
  onClose: () => void;
}

export function RegionDetail({ regionId, checkIn, onClose }: Props) {
  const region = BODY_REGIONS[regionId];
  const results = checkIn ? triageCheckIn(checkIn) : [];
  const severity = checkIn
    ? regionSeverity(regionId, results, checkIn.symptoms, checkIn.regionDiscomfort)
    : 'green';
  const relevant = results.filter(
    (r) => region.indicators.includes(r.indicatorId) && r.severity !== 'green',
  );

  const flags: string[] = [];
  if (checkIn?.symptoms?.sansVisualChanges && regionId === 'head_eyes')
    flags.push('Visual changes reported (possible SANS)');
  if (checkIn?.symptoms?.rash && regionId === 'skin_immune') flags.push('Skin rash reported');
  if (
    checkIn?.symptoms?.orthostaticDizziness &&
    (regionId === 'cardio' || regionId === 'msk')
  )
    flags.push('Dizziness on standing reported');
  const discomfort = checkIn?.regionDiscomfort?.[regionId];
  if (discomfort && discomfort.level > 0) {
    flags.push(
      `Discomfort ${discomfort.level}/10${discomfort.note ? ` — ${discomfort.note}` : ''}`,
    );
  }

  return (
    <aside key={regionId} className="flex h-full flex-col" aria-label={`${region.label} details`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="h-section">{region.label}</h2>
          <p className="mt-1 text-sm text-dust">{region.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 rounded-md p-1.5 text-faint transition-colors hover:bg-deck hover:text-star"
          aria-label="Close region details"
        >
          <IconClose width={18} height={18} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <SeverityBadge severity={severity} />
        <span className="text-xs text-faint">
          Watch for: {region.hazards.map((h) => HAZARDS[h].shortName.toLowerCase()).join(', ')}
        </span>
      </div>

      <p className="mt-4 border-l-2 border-rule-strong pl-3 text-sm leading-relaxed text-dust">
        {region.functionNote}
      </p>

      <dl className="mt-5 divide-y divide-rule border-y border-rule">
        {region.indicators.map((id) => {
          const def = INDICATORS[id];
          const value = indicatorValue(checkIn, id);
          const sev = value != null ? severityFor(id, value) : 'green';
          return (
            <div key={id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-dust">{def.label}</dt>
                <dd className="readout text-base" style={{ color: sev === 'green' ? 'rgb(var(--c-text))' : SEVERITY_COLOR[sev] }}>
                  {value != null ? formatValue(id, value) : '–'}
                  <span className="ml-1 text-xs font-normal text-faint">{def.unit}</span>
                </dd>
              </div>
              <div className="mt-1.5">
                <BandScale id={id} value={value} severity={sev} height={4} />
              </div>
            </div>
          );
        })}
      </dl>

      {flags.length > 0 && (
        <ul className="mt-4 space-y-1">
          {flags.map((f) => (
            <li key={f} className="text-sm text-sev-amber">
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 space-y-2">
        {relevant.length === 0 ? (
          <p className="text-sm text-dust">Nothing to act on in this region. Keep up your routines.</p>
        ) : (
          relevant.map((r, i) => <AlertCard key={r.indicatorId} result={r} defaultOpen={i === 0} />)
        )}
      </div>
    </aside>
  );
}
