import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
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
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const base = selected ? 1.15 : 1;
    const pulse =
      severity === 'red' ? 1 + Math.sin(clock.elapsedTime * 4) * 0.1 : 1;
    ref.current.scale.setScalar(base * pulse);
  });

  const radius = selected ? 0.07 : 0.055;

  return (
    <group
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
      {/* solid core */}
      <mesh>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.95 : severity === 'red' ? 0.75 : 0.4}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* wireframe halo matching body style */}
      <mesh>
        <sphereGeometry args={[radius * 1.45, 12, 10]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}
