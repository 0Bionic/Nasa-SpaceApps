import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { BODY_REGION_LIST } from '@/domain/regions';
import type { BodyRegionId, CheckInRecord, Severity, SymptomFlags } from '@/domain/types';
import { allRegionSeverities, triageCheckIn } from '@/domain/triage/engine';
import { severityColor } from '@/components/SeverityBadge';
import { RegionMesh } from './RegionMesh';
import { AvatarShell } from './AvatarShell';

interface Props {
  checkIn?: CheckInRecord | null;
  selected: BodyRegionId | null;
  onSelect: (id: BodyRegionId) => void;
}

function LoaderFallback() {
  return (
    <mesh position={[0, 0.9, 0]}>
      <boxGeometry args={[0.35, 1.5, 0.2]} />
      <meshBasicMaterial color="#1a3355" wireframe />
    </mesh>
  );
}

export function BodyMap({ checkIn, selected, onSelect }: Props) {
  const severities = useMemo(() => {
    if (!checkIn) {
      return Object.fromEntries(
        BODY_REGION_LIST.map((r) => [r.id, 'green' as Severity]),
      ) as Record<BodyRegionId, Severity>;
    }
    const results = triageCheckIn(checkIn);
    return allRegionSeverities(results, checkIn.symptoms as SymptomFlags);
  }, [checkIn]);

  return (
    <div className="panel relative h-[420px] w-full overflow-hidden sm:h-[520px]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 space-y-1">
        <p className="font-display text-xs tracking-widest text-teal-soft">BODY MAP</p>
        <p className="text-xs text-slate-400">Tap a region · drag to orbit</p>
      </div>
      <Canvas camera={{ position: [0.65, 1.05, 2.55], fov: 38 }} dpr={[1, 1.75]}>
        <color attach="background" args={['#07111f']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={0.5} />
        <Suspense fallback={<LoaderFallback />}>
          <AvatarShell />
          {BODY_REGION_LIST.map((region) => (
            <RegionMesh
              key={region.id}
              region={region}
              severity={severities[region.id]}
              selected={selected === region.id}
              color={severityColor(severities[region.id])}
              onSelect={onSelect}
            />
          ))}
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.7}
          maxDistance={4.2}
          target={[0, 0.9, 0]}
          maxPolarAngle={Math.PI * 0.78}
        />
      </Canvas>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {BODY_REGION_LIST.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                selected === r.id
                  ? 'border-teal-glow bg-teal-glow/20 text-teal-soft'
                  : 'border-white/10 bg-space-950/70 text-slate-300 hover:border-white/25'
              }`}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ background: severityColor(severities[r.id]) }}
              />
              {r.shortLabel}
            </button>
          ))}
        </div>
        <p className="max-w-[14rem] text-right text-[9px] leading-snug text-slate-500">
          Model: “3D human body wireframe” by Syed Mohammad Hasan (CC-BY-4.0)
        </p>
      </div>
    </div>
  );
}
