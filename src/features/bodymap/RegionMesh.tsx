import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import type { BodyRegionDefinition } from '@/domain/regions';
import type { BodyRegionId, Severity } from '@/domain/types';

interface Props {
  region: BodyRegionDefinition;
  severity: Severity;
  selected: boolean;
  color: string;
  onSelect: (id: BodyRegionId) => void;
}

export function RegionMesh({ region, severity, selected, color, onSelect }: Props) {
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const base = selected ? 1.18 : 1;
    const pulse =
      severity === 'red' ? 1 + Math.sin(clock.elapsedTime * 4) * 0.08 : 1;
    ref.current.scale.setScalar(base * pulse);
  });

  return (
    <mesh
      ref={ref}
      position={region.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(region.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <sphereGeometry args={[selected ? 0.14 : 0.11, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={selected ? 0.85 : severity === 'red' ? 0.7 : 0.35}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}
