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

const CX = 300;

/* Right half of the body contour as (dx from centre, y). Mirrored for the left. */
const RIGHT: [number, number][] = [
  [11, 86], [13, 100], [38, 108], [58, 115], [68, 128], [74, 160], [80, 200], [86, 228],
  [91, 264], [95, 298], [100, 314], [99, 334], [92, 346], [85, 338], [83, 318], [80, 300],
  [74, 264], [68, 226], [61, 186], [55, 152], [50, 172], [44, 205], [41, 232], [46, 258],
  [50, 288], [47, 324], [41, 366], [37, 392], [35, 424], [32, 460], [36, 474], [44, 486],
  [30, 491], [17, 488], [16, 470], [15, 430], [16, 392], [14, 352], [9, 314], [3, 300],
];

function catmullRom(points: [number, number][]): string {
  const p = points;
  const n = p.length;
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

const BODY_PATH = (() => {
  const right = RIGHT.map(([dx, y]) => [CX + dx, y] as [number, number]);
  const left = [...RIGHT].reverse().map(([dx, y]) => [CX - dx, y] as [number, number]);
  return catmullRom([...right, ...left]);
})();

const DETAIL_PATHS = [
  // clavicles
  `M${CX - 44},113 Q${CX - 20},104 ${CX},110 Q${CX + 20},104 ${CX + 44},113`,
  // sternum
  `M${CX},110 L${CX},192`,
  // rib arcs
  ...[140, 160, 180].map((y) => `M${CX - 36},${y + 10} Q${CX},${y - 12} ${CX + 36},${y + 10}`),
  // inguinal lines
  `M${CX - 42},262 Q${CX - 20},282 ${CX - 4},298`,
  `M${CX + 42},262 Q${CX + 20},282 ${CX + 4},298`,
  // knees
  `M${CX - 34},368 Q${CX - 27},378 ${CX - 20},368`,
  `M${CX + 20},368 Q${CX + 27},378 ${CX + 34},368`,
  // elbows
  `M${CX - 86},226 q6,4 12,0`,
  `M${CX + 74},226 q6,4 12,0`,
];

interface Anchor {
  node: [number, number];
  side: 'left' | 'right';
}

const ANCHORS: Record<BodyRegionId, Anchor> = {
  behavioral: { node: [CX, 42], side: 'left' },
  head_eyes: { node: [CX + 10, 63], side: 'right' },
  resp: { node: [CX - 20, 152], side: 'left' },
  cardio: { node: [CX + 15, 162], side: 'right' },
  skin_immune: { node: [CX + 83, 262], side: 'right' },
  msk: { node: [CX - 27, 372], side: 'left' },
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
    ? allRegionSeverities(results, checkIn.symptoms)
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
  const compact = useIsCompact();
  const viewBox = compact ? `${CX - 125} 10 250 495` : '0 0 600 510';

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
        aria-label="Body status map. Select a region to see its readings."
      >
        <defs>
          <radialGradient id="plate-glow" cx="50%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#7FB2FF" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#7FB2FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx={CX} cy={230} rx={190} ry={260} fill="url(#plate-glow)" />

        {/* centre axis */}
        <line
          x1={CX} y1={14} x2={CX} y2={500}
          stroke="#22344F" strokeDasharray="2 5" className="plate-fade"
          style={{ animationDelay: '0.2s' }}
        />

        {/* figure */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={BODY_PATH}
            pathLength={1}
            stroke="#A9BAD3"
            strokeWidth={1.4}
            className="plate-draw"
            fill="#0F1B2E"
            fillOpacity={0.6}
          />
          <ellipse
            cx={CX} cy={58} rx={21} ry={26}
            pathLength={1}
            stroke="#A9BAD3"
            strokeWidth={1.4}
            className="plate-draw"
            fill="#0F1B2E"
          />
          <g stroke="#5C6E8A" strokeWidth={1} className="plate-fade" style={{ animationDelay: '1.1s' }}>
            {DETAIL_PATHS.map((d) => (
              <path key={d} d={d} />
            ))}
            <circle cx={CX} cy={234} r={1.6} />
          </g>
        </g>

        {/* regions */}
        {ORDER.map((id, i) => {
          const region = BODY_REGIONS[id];
          const { node, side } = ANCHORS[id];
          const reading = readings[id];
          const color = SEVERITY_COLOR[reading.severity];
          const isSel = selected === id;
          const lx = LABEL_X[side];
          const anchor = side === 'left' ? 'end' : 'start';
          const tx = side === 'left' ? lx - 10 : lx + 10;
          const delay = 1.25 + i * 0.09;

          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={`${region.label}: ${SEVERITY_LABEL[reading.severity]}. ${reading.detail}`}
              onClick={() => onSelect(id)}
              onKeyDown={keyActivate(id)}
              className="plate-hit group cursor-pointer"
            >
              {/* leader line + label: desktop only */}
              {!compact && (
                <>
                  <path
                    d={`M${node[0]},${node[1]} L${lx},${node[1]}`}
                    pathLength={1}
                    stroke={isSel ? color : '#33496A'}
                    strokeWidth={isSel ? 1.4 : 1}
                    fill="none"
                    className="plate-draw transition-[stroke] duration-200 group-hover:stroke-[#7FB2FF]"
                    style={{ animationDelay: `${delay + 0.15}s`, animationDuration: '0.5s' }}
                  />
                  <circle
                    cx={lx} cy={node[1]} r={2}
                    fill={isSel ? color : '#33496A'}
                    className="plate-fade"
                    style={{ animationDelay: `${delay + 0.5}s` }}
                  />
                  <g className="plate-fade" style={{ animationDelay: `${delay + 0.55}s` }}>
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
                      className="fill-star text-[14px] font-semibold"
                      style={{ fontVariationSettings: "'wdth' 112" }}
                    >
                      {region.label}
                    </text>
                    <text
                      x={tx}
                      y={node[1] + 14}
                      textAnchor={anchor}
                      className="text-[12px]"
                      fill={reading.severity === 'green' ? '#8D9DB5' : color}
                    >
                      {reading.detail}
                    </text>
                  </g>
                </>
              )}

              {/* node */}
              <circle cx={node[0]} cy={node[1]} r={18} fill="transparent" />
              {reading.severity === 'red' && (
                <circle
                  cx={node[0]} cy={node[1]} r={6}
                  fill="none" stroke={color} strokeWidth={1.5}
                  className="plate-sonar animate-sonar"
                  style={{ animationDelay: `${delay + 0.4}s` }}
                />
              )}
              <g className="plate-node" style={{ animationDelay: `${delay}s` }}>
                <circle
                  cx={node[0]} cy={node[1]} r={isSel ? 11 : 8.5}
                  fill="#0A1322" fillOpacity={0.7}
                  stroke={color} strokeWidth={isSel ? 2 : 1.25}
                  className="transition-all duration-200"
                />
                <circle cx={node[0]} cy={node[1]} r={isSel ? 5 : 4} fill={color} className="transition-all duration-200" />
                <circle
                  cx={node[0]} cy={node[1]} r={15}
                  fill="none" stroke="#7FB2FF" strokeWidth={1.5}
                  className="plate-focus opacity-0"
                />
              </g>
            </g>
          );
        })}

        {/* plate registration marks */}
        {!compact && (
          <g stroke="#33496A" strokeWidth={1} className="plate-fade" style={{ animationDelay: '0.1s' }}>
            <path d="M8,22 V8 H22" fill="none" />
            <path d="M578,8 H592 V22" fill="none" />
            <path d="M8,488 V502 H22" fill="none" />
            <path d="M578,502 H592 V488" fill="none" />
          </g>
        )}
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
                      style={{ color: r.severity === 'green' ? '#8D9DB5' : SEVERITY_COLOR[r.severity] }}
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
