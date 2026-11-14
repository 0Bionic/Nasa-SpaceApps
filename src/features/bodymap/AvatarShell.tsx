export function AvatarShell() {
  return (
    <group>
      {/* stylized humanoid silhouette */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.2} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.28, 0.55, 8, 16]} />
        <meshStandardMaterial color="#16304f" metalness={0.15} roughness={0.6} />
      </mesh>
      <mesh position={[-0.42, 1.05, 0]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.08, 0.45, 6, 12]} />
        <meshStandardMaterial color="#16304f" />
      </mesh>
      <mesh position={[0.42, 1.05, 0]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.08, 0.45, 6, 12]} />
        <meshStandardMaterial color="#16304f" />
      </mesh>
      <mesh position={[-0.14, 0.4, 0]}>
        <capsuleGeometry args={[0.1, 0.55, 6, 12]} />
        <meshStandardMaterial color="#12263f" />
      </mesh>
      <mesh position={[0.14, 0.4, 0]}>
        <capsuleGeometry args={[0.1, 0.55, 6, 12]} />
        <meshStandardMaterial color="#12263f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.9, 48]} />
        <meshStandardMaterial color="#0b1829" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
