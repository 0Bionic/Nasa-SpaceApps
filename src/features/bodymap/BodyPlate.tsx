import { useEffect, useMemo, useState } from 'react';
import { BODY_REGION_LIST, BODY_REGIONS } from '@/domain/regions';
import { INDICATORS } from '@/domain/indicators';
import { allRegionSeverities, triageCheckIn } from '@/domain/triage/engine';
import {
  SEVERITY_RANK,
  type BodyRegionId,
  type CheckInRecord,
  type Severity,
  type TriageResult,
} from '@/domain/types';
import { SeverityGlyph } from '@/components/SeverityBadge';
import { SEVERITY_COLOR, SEVERITY_LABEL, withUnit } from '@/components/vitals';
import { useAppStore } from '@/store/useAppStore';
import { AstronautFigure, CX } from './AstronautFigure';
import { useLargeText } from '@/app/textSize';

interface Anchor {
  node: [number, number];
  side: 'left' | 'right';
}

const ANCHORS: Record<BodyRegionId, Anchor> = {
  behavioral: { node: [CX - 8, 44], side: 'left' },
  head_eyes: { node: [CX + 12, 70], side: 'right' },
  resp: { node: [CX - 26, 168], side: 'left' },
  cardio: { node: [CX + 26, 168], side: 'right' },
  skin_immune: { node: [CX + 92, 262], side: 'right' },
  msk: { node: [CX - 30, 384], side: 'left' },
};

const COMPACT_NAME: Record<BodyRegionId, string> = {
  behavioral: 'Mind & sleep',
  head_eyes: 'Head & eyes',
  resp: 'Lungs',
  cardio: 'Heart',
  skin_immune: 'Skin & immune',
  msk: 'Muscle & bone',
};

const LABEL_X = { left: CX - 150, right: CX + 150 };

/** Order the regions animate in: top of the body to the bottom. */
const ORDER: BodyRegionId[] = ['behavioral', 'head_eyes', 'resp', 'cardio', 'skin_immune', 'msk'];

function useIsCompact() {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setCompact(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return compact;
}

export interface RegionReading {
  severity: Severity;
  detail: string;
}

export function regionReadings(checkIn: CheckInRecord | null | undefined) {
  const results: TriageResult[] = checkIn ? triageCheckIn(checkIn) : [];
  const severities = checkIn
    ? allRegionSeverities(results, checkIn.symptoms, checkIn.regionDiscomfort)
    : (Object.fromEntries(BODY_REGION_LIST.map((r) => [r.id, 'green'])) as Record<BodyRegionId, Severity>);

  const out = {} as Record<BodyRegionId, RegionReading>;
  for (const region of BODY_REGION_LIST) {
    const severity = severities[region.id];
    const worst = results
      .filter((r) => region.indicators.includes(r.indicatorId))
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];

    let detail = 'No reading yet';
    if (checkIn) {
      if (worst && worst.severity === severity && severity !== 'green') {
        const def = INDICATORS[worst.indicatorId];
        detail = `${def.label} ${withUnit(worst.indicatorId, worst.value)}`;
      } else if (severity !== 'green') {
        detail =
          region.id === 'head_eyes'
            ? 'Visual changes reported'
            : region.id === 'skin_immune'
              ? 'Skin rash reported'
              : 'Dizziness on standing';
      } else {
        detail = 'Within limits';
      }
    }
    out[region.id] = { severity, detail };
  }
  return out;
}

interface Props {
  checkIn?: CheckInRecord | null;
  selected: BodyRegionId | null;
  onSelect: (id: BodyRegionId) => void;
}

export function BodyPlate({ checkIn, selected, onSelect }: Props) {
  const readings = useMemo(() => regionReadings(checkIn), [checkIn]);
  const narrow = useIsCompact();
  // Large text makes the side callouts too wide, so use the list layout instead.
  const compact = narrow || useLargeText();
  const profile = useAppStore((s) => s.profile);
  const viewBox = compact ? `${CX - 125} 10 250 495` : '-60 0 720 510';

  const keyActivate = (id: BodyRegionId) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div className="relative">
      <svg
        viewBox={viewBox}
        className={compact ? 'mx-auto block h-[400px] w-full' : 'block h-auto w-full'}
        role="group"
        aria-label={`${profile?.name ?? 'Crew member'}: body status map. Select a region to see its readings.`}
      >
        {/* the crew member's suit */}
        <AstronautFigure
          name={profile?.name ?? ''}
          environment={profile?.environment ?? 'station'}
          missionDay={profile?.missionDay ?? 0}
          overall={checkIn?.overallSeverity ?? null}
        />

        {/* regions */}
        {ORDER.map((id) => {
          const region = BODY_REGIONS[id];
          const { node, side } = ANCHORS[id];
          const reading = readings[id];
          const color = SEVERITY_COLOR[reading.severity];
          const isSel = selected === id;
          const lx = LABEL_X[side];
          const anchor = side === 'left' ? 'end' : 'start';
          const tx = side === 'left' ? lx - 10 : lx + 10;

          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={`${region.label}: ${SEVERITY_LABEL[reading.severity]}. ${reading.detail}`}
              onClick={() => onSelect(id)}
              onKeyDown={keyActivate(id)}
              className="plate-hit cursor-pointer"
            >
              {!compact && (
                <>
                  <path
                    d={`M${node[0]},${node[1]} L${lx},${node[1]}`}
                    stroke={isSel ? color : 'rgb(var(--c-line-strong))'}
                    strokeWidth={isSel ? 1.4 : 1}
                    fill="none"
                  />
                  <circle
                    cx={lx} cy={node[1]} r={2}
                    fill={isSel ? color : 'rgb(var(--c-line-strong))'}
                  />
                  <g>
                    <rect
                      x={side === 'left' ? lx - 170 : lx}
                      y={node[1] - 26}
                      width={170}
                      height={50}
                      fill="transparent"
                    />
                    <text
                      x={tx}
                      y={node[1] - 5}
                      textAnchor={anchor}
                      className="fill-star text-sm font-semibold"
                    >
                      {region.label}
                    </text>
                    <text
                      x={tx}
                      y={node[1] + 14}
                      textAnchor={anchor}
                      className="text-xs"
                      fill={reading.severity === 'green' ? 'rgb(var(--c-muted))' : color}
                    >
                      {reading.detail}
                    </text>
                  </g>
                </>
              )}

              <circle cx={node[0]} cy={node[1]} r={18} fill="transparent" />
              <g>
                <circle cx={node[0]} cy={node[1]} r={isSel ? 13 : 11} fill="rgb(var(--c-bg))" />
                <circle
                  cx={node[0]} cy={node[1]} r={isSel ? 10 : 8}
                  fill="rgb(var(--c-bg))"
                  stroke={color} strokeWidth={isSel ? 2.5 : 2}
                />
                <circle cx={node[0]} cy={node[1]} r={isSel ? 4.5 : 3.5} fill={color} />
                <circle
                  cx={node[0]} cy={node[1]} r={14}
                  fill="none" stroke="rgb(var(--c-accent))" strokeWidth={1.5}
                  className="plate-focus opacity-0"
                />
              </g>
            </g>
          );
        })}
      </svg>

      {/* compact: region list replaces callouts */}
      {compact && (
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {ORDER.map((id) => {
            const r = readings[id];
            const isSel = selected === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-pressed={isSel}
                  className={`flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors ${
                    isSel ? 'border-limb/70 bg-deck' : 'border-rule hover:border-rule-strong'
                  }`}
                >
                  <span className="mt-1">
                    <SeverityGlyph severity={r.severity} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-star">
                      {COMPACT_NAME[id]}
                    </span>
                    <span
                      className="block truncate text-xs"
                      style={{ color: r.severity === 'green' ? 'rgb(var(--c-muted))' : SEVERITY_COLOR[r.severity] }}
                    >
                      {r.detail}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
