import { useId } from 'react';
import { create } from 'zustand';
import type { MissionEnvironment, Severity } from '@/domain/types';
import { SEVERITY_COLOR } from '@/components/vitals';

/**
 * Full-body spacesuit for the Status body map, drawn on the same 600 × 510 grid
 * (centre x = 300) as the region hotspots. Personalised with the crew member's
 * name tag, a mission patch for their destination, a suit colour they pick, and
 * chest-panel lights that show today's overall status.
 */

export const CX = 300;

/* ------------------------------------------------------------------ */
/* Suit colour preference                                              */
/* ------------------------------------------------------------------ */

export type SuitStyle = 'white' | 'orange' | 'blue';

export const SUIT_LABEL: Record<SuitStyle, string> = {
  white: 'EVA white',
  orange: 'Launch orange',
  blue: 'Flight blue',
};

const SUIT_KEY = 'aetherhealth-suit';

function loadSuit(): SuitStyle {
  try {
    const v = localStorage.getItem(SUIT_KEY);
    if (v === 'white' || v === 'orange' || v === 'blue') return v;
  } catch {
    /* storage unavailable */
  }
  return 'white';
}

export const useSuit = create<{ suit: SuitStyle; setSuit: (s: SuitStyle) => void }>((set) => ({
  suit: loadSuit(),
  setSuit: (suit) => {
    try {
      localStorage.setItem(SUIT_KEY, suit);
    } catch {
      /* still applies for this visit */
    }
    set({ suit });
  },
}));

/** Fill, shading and outline per suit. White follows the theme so it reads on both backgrounds. */
const SUIT_COLORS: Record<SuitStyle, { fill: string; shade: string; line: string; soft: string }> = {
  white: {
    fill: 'rgb(var(--suit-fill))',
    shade: 'rgb(var(--suit-shade))',
    line: 'rgb(var(--suit-line))',
    soft: 'rgb(var(--suit-soft))',
  },
  orange: { fill: '#EF7A26', shade: '#C9601A', line: '#7A3508', soft: '#F59A55' },
  blue: { fill: '#2A5FB8', shade: '#1E4790', line: '#0C2554', soft: '#4D7FD0' },
};

/* ------------------------------------------------------------------ */
/* Personal details                                                    */
/* ------------------------------------------------------------------ */

const MISSION_PATCH: Record<MissionEnvironment, { label: string; body: 'earth' | 'moon' | 'mars' }> = {
  station: { label: 'LEO', body: 'earth' },
  surface_base: { label: 'LUNA', body: 'moon' },
  rover: { label: 'LUNA', body: 'moon' },
  spacecraft: { label: 'MARS', body: 'mars' },
};

/** "Cmdr. Avery Chen" → "CHEN". */
export function surname(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => !/\.$/.test(p));
  return (parts[parts.length - 1] ?? name).toUpperCase().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/** A limb is a thick stroked polyline: outline first, then fill, so joints stay smooth. */
const LIMBS = {
  armL: `M${CX - 58},128 L${CX - 86},212 L${CX - 96},288`,
  armR: `M${CX + 58},128 L${CX + 86},212 L${CX + 96},288`,
  legL: `M${CX - 24},286 L${CX - 30},384 L${CX - 32},458`,
  legR: `M${CX + 24},286 L${CX + 30},384 L${CX + 32},458`,
};

const TORSO = `M${CX - 64},126 C${CX - 64},108 ${CX - 40},100 ${CX},100 C${CX + 40},100 ${CX + 64},108 ${CX + 64},126
  L${CX + 58},204 C${CX + 56},232 ${CX + 52},250 ${CX + 48},264 L${CX - 48},264 C${CX - 52},250 ${CX - 56},232 ${CX - 58},204 Z`;

const BRIEF = `M${CX - 50},258 L${CX + 50},258 L${CX + 54},300 C${CX + 40},312 ${CX + 10},314 ${CX},306
  C${CX - 10},314 ${CX - 40},312 ${CX - 54},300 Z`;

function Ring({ x, y, w, angle = 0, line }: { x: number; y: number; w: number; angle?: number; line: string }) {
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <rect x={x - w / 2} y={y - 4} width={w} height={8} rx={4} fill="none" stroke={line} strokeWidth={1.4} />
    </g>
  );
}

function PatchGlyph({ body, x, y }: { body: 'earth' | 'moon' | 'mars'; x: number; y: number }) {
  if (body === 'moon') {
    return (
      <g>
        <circle cx={x} cy={y} r={6} fill="#D9DCE3" />
        <circle cx={x - 2} cy={y - 1.5} r={1.4} fill="#AEB4C0" />
        <circle cx={x + 2.2} cy={y + 2} r={1} fill="#AEB4C0" />
      </g>
    );
  }
  if (body === 'mars') {
    return (
      <g>
        <circle cx={x} cy={y} r={6} fill="#C1440E" />
        <path d={`M${x - 5},${y - 1} q3,-2 6,0 q2,1 4,-1`} stroke="#8A2E06" strokeWidth={1} fill="none" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={x} cy={y} r={6} fill="#2E7BD6" />
      <path d={`M${x - 3},${y - 4} q2,2 0,4 q-2,2 1,4 M${x + 2},${y - 3} q2,1 1,3`} stroke="#3FA34D" strokeWidth={1.6} fill="none" />
      <ellipse cx={x} cy={y} rx={9.5} ry={2.6} fill="none" stroke="#E7ECF5" strokeWidth={0.9} transform={`rotate(-20 ${x} ${y})`} />
    </g>
  );
}

interface FigureProps {
  name: string;
  environment: MissionEnvironment;
  missionDay: number;
  overall: Severity | null;
}

export function AstronautFigure({ name, environment, missionDay, overall }: FigureProps) {
  const suit = useSuit((s) => s.suit);
  const c = SUIT_COLORS[suit];
  const uid = useId().replace(/:/g, '');
  const patch = MISSION_PATCH[environment];
  const tag = surname(name);
  const statusColor = overall ? SEVERITY_COLOR[overall] : 'rgb(var(--c-dim))';

  const limb = (d: string, w: number) => (
    <g key={d}>
      <path d={d} stroke={c.line} strokeWidth={w + 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={c.fill} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={c.shade} strokeOpacity={0.55} strokeWidth={w * 0.28} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(4 0)" />
    </g>
  );

  return (
    <g aria-hidden="true">
      <defs>
        <radialGradient id={`visor-${uid}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFE7A3" />
          <stop offset="45%" stopColor="#E0AE3C" />
          <stop offset="100%" stopColor="#7A5310" />
        </radialGradient>
        <linearGradient id={`helmet-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.soft} />
          <stop offset="100%" stopColor={c.shade} />
        </linearGradient>
      </defs>

      {/* life-support backpack behind the torso */}
      <rect x={CX - 70} y={96} width={140} height={150} rx={18} fill={c.shade} stroke={c.line} strokeWidth={1.5} />

      {/* legs, then boots */}
      {limb(LIMBS.legL, 40)}
      {limb(LIMBS.legR, 40)}
      <Ring x={CX - 30} y={384} w={44} line={c.line} />
      <Ring x={CX + 30} y={384} w={44} line={c.line} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <path
            d={`M${CX + s * 32 - 26},${462} L${CX + s * 32 + 26},${462} L${CX + s * 32 + 28},${490} C${CX + s * 32 + 28},${496} ${CX + s * 32 + 24},${498} ${CX + s * 32 + 18},${498}
              L${CX + s * 32 - 18},${498} C${CX + s * 32 - 24},${498} ${CX + s * 32 - 28},${496} ${CX + s * 32 - 28},${490} Z`}
            fill={c.shade}
            stroke={c.line}
            strokeWidth={1.5}
          />
          <line x1={CX + s * 32 - 27} x2={CX + s * 32 + 27} y1={490} y2={490} stroke={c.line} strokeWidth={1.2} />
        </g>
      ))}

      {/* lower torso */}
      <path d={BRIEF} fill={c.fill} stroke={c.line} strokeWidth={1.5} />

      {/* arms and gloves */}
      {limb(LIMBS.armL, 34)}
      {limb(LIMBS.armR, 34)}
      <Ring x={CX - 86} y={212} w={38} angle={18} line={c.line} />
      <Ring x={CX + 86} y={212} w={38} angle={-18} line={c.line} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={CX + s * 96 - 19} y={282} width={38} height={10} rx={4} fill={c.line} />
          <path
            d={`M${CX + s * 96 - 16},${292} C${CX + s * 96 - 20},${306} ${CX + s * 96 - 14},${324} ${CX + s * 96},${326} C${CX + s * 96 + 14},${324} ${CX + s * 96 + 20},${306} ${CX + s * 96 + 16},${292} Z`}
            fill={c.shade}
            stroke={c.line}
            strokeWidth={1.5}
          />
        </g>
      ))}

      {/* upper torso */}
      <path d={TORSO} fill={c.fill} stroke={c.line} strokeWidth={1.6} />
      <path d={`M${CX - 50},258 L${CX + 50},258`} stroke={c.line} strokeWidth={6} strokeLinecap="round" />
      <path d={`M${CX - 50},258 L${CX + 50},258`} stroke={c.shade} strokeWidth={3} strokeLinecap="round" />
      {/* shoulder bearings */}
      <circle cx={CX - 58} cy={126} r={19} fill={c.fill} stroke={c.line} strokeWidth={1.5} />
      <circle cx={CX + 58} cy={126} r={19} fill={c.fill} stroke={c.line} strokeWidth={1.5} />
      <circle cx={CX - 58} cy={126} r={12} fill="none" stroke={c.line} strokeOpacity={0.5} strokeWidth={1} />
      <circle cx={CX + 58} cy={126} r={12} fill="none" stroke={c.line} strokeOpacity={0.5} strokeWidth={1} />

      {/* name tag */}
      <rect x={CX - 52} y={120} width={44} height={16} rx={2.5} fill="rgb(var(--c-bg))" stroke={c.line} strokeWidth={1} />
      <text x={CX - 30} y={131.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="JetBrains Mono, monospace" letterSpacing={0.6} fill="rgb(var(--c-text))">
        {tag}
      </text>

      {/* mission patch */}
      <g>
        <circle cx={CX + 30} cy={128} r={13} fill="#0B1730" stroke="#E7ECF5" strokeWidth={1.4} />
        <PatchGlyph body={patch.body} x={CX + 30} y={125} />
        <text x={CX + 30} y={137.5} textAnchor="middle" fontSize={5.2} fontWeight={700} fontFamily="JetBrains Mono, monospace" fill="#E7ECF5">
          {patch.label}·D{missionDay}
        </text>
      </g>

      {/* chest display & control module; lights show today's overall status */}
      <rect x={CX - 30} y={196} width={60} height={40} rx={6} fill={c.shade} stroke={c.line} strokeWidth={1.5} />
      <rect x={CX - 24} y={202} width={30} height={12} rx={2} fill="#0B1730" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={CX - 18 + i * 9} cy={208} r={2.4} fill={statusColor} opacity={i === 0 ? 1 : 0.55} />
      ))}
      <circle cx={CX + 18} cy={208} r={5} fill={c.fill} stroke={c.line} strokeWidth={1.2} />
      <circle cx={CX - 12} cy={226} r={4} fill={c.fill} stroke={c.line} strokeWidth={1.2} />
      <circle cx={CX + 4} cy={226} r={4} fill={c.fill} stroke={c.line} strokeWidth={1.2} />
      <rect x={CX + 13} y={221} width={11} height={10} rx={2} fill={c.fill} stroke={c.line} strokeWidth={1.2} />

      {/* neck ring and helmet */}
      <ellipse cx={CX} cy={102} rx={36} ry={9} fill={c.shade} stroke={c.line} strokeWidth={1.5} />
      <circle cx={CX} cy={60} r={42} fill={`url(#helmet-${uid})`} stroke={c.line} strokeWidth={1.6} />
      <path
        d={`M${CX - 32},64 C${CX - 32},38 ${CX - 18},28 ${CX},28 C${CX + 18},28 ${CX + 32},38 ${CX + 32},64 C${CX + 32},84 ${CX + 18},92 ${CX},92 C${CX - 18},92 ${CX - 32},84 ${CX - 32},64 Z`}
        fill={`url(#visor-${uid})`}
        stroke={c.line}
        strokeWidth={1.4}
      />
      <path d={`M${CX - 22},48 C${CX - 16},36 ${CX - 4},33 ${CX + 6},34`} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d={`M${CX + 18},76 C${CX + 22},72 ${CX + 25},66 ${CX + 25},60`} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" fill="none" />
      {/* helmet lights */}
      <rect x={CX - 44} y={44} width={8} height={14} rx={2} fill={c.shade} stroke={c.line} strokeWidth={1} />
      <rect x={CX + 36} y={44} width={8} height={14} rx={2} fill={c.shade} stroke={c.line} strokeWidth={1} />
    </g>
  );
}
