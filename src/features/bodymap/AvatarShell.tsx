import { useGLTF } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';

/** Public URL for the Sketchfab CC-BY wireframe human (scene.gltf + bin + textures). */
export const HUMAN_MODEL_URL = '/models/human-wireframe/scene.gltf';

const TARGET_HEIGHT = 1.75;
const WIRE_COLOR = '#5eead4';
/**
 * Fraction of triangle indices to keep after weld + simplify.
 * Higher = denser cage that spans the body more; lower = bigger emptier faces.
 */
const KEEP_INDEX_RATIO = 0.16;
/** Allowed geometric error (relative). Higher lets simplifier reach the target. */
const SIMPLIFY_ERROR = 0.045;

function toFloat32Positions(attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): Float32Array {
  const arr = attr.array;
  if (attr instanceof THREE.InterleavedBufferAttribute) {
    const out = new Float32Array(attr.count * 3);
    for (let i = 0; i < attr.count; i++) {
      out[i * 3] = attr.getX(i);
      out[i * 3 + 1] = attr.getY(i);
      out[i * 3 + 2] = attr.getZ(i);
    }
    return out;
  }
  if (arr instanceof Float32Array && attr.itemSize === 3) {
    return arr;
  }
  const out = new Float32Array(attr.count * 3);
  for (let i = 0; i < attr.count; i++) {
    out[i * 3] = attr.getX(i);
    out[i * 3 + 1] = attr.getY(i);
    out[i * 3 + 2] = attr.getZ(i);
  }
  return out;
}

/** Weld verts → decimate → opaque-free wireframe mesh with large faces spanning the body. */
function decimateToWireGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = geometry.clone();
  if (!geo.getAttribute('position')) return geo;

  // Drop non-position attrs so welding can merge shading/UV splits
  for (const key of Object.keys(geo.attributes)) {
    if (key !== 'position') geo.deleteAttribute(key);
  }
  geo.clearGroups();

  if (!geo.index) {
    geo = mergeVertices(geo.toNonIndexed(), 1e-4);
  } else {
    geo = mergeVertices(geo, 1e-4);
  }

  const posAttr = geo.getAttribute('position');
  if (!geo.index || !posAttr) return geo;

  const positions = toFloat32Positions(posAttr);
  const indices = new Uint32Array(geo.index.array);
  let target = Math.floor(indices.length * KEEP_INDEX_RATIO);
  target = Math.max(300, target - (target % 3));

  const [simplified] = MeshoptSimplifier.simplify(
    indices,
    positions,
    3,
    target,
    SIMPLIFY_ERROR,
    ['Prune'],
  );

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  out.setIndex(new THREE.BufferAttribute(simplified, 1));
  out.computeVertexNormals();
  return out;
}

function buildWireBody(scene: THREE.Group | THREE.Object3D): THREE.Group {
  const model = scene.clone(true);

  const meshes: THREE.Mesh[] = [];
  model.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) meshes.push(mesh);
  });

  const wireMat = new THREE.MeshBasicMaterial({
    color: WIRE_COLOR,
    wireframe: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  for (const mesh of meshes) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.geometry = decimateToWireGeometry(mesh.geometry);
    mesh.material = wireMat;
  }

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);

  const group = new THREE.Group();
  group.add(model);
  if (size.y > 0.0001) {
    group.scale.setScalar(TARGET_HEIGHT / size.y);
  }
  return group;
}

/**
 * Loads the glTF human, decimates to larger faces, and draws a transparent
 * wireframe so polygons visibly span the body (not an empty crease-only cage).
 */
export function AvatarShell() {
  const { scene } = useGLTF(HUMAN_MODEL_URL);
  const [prepared, setPrepared] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await MeshoptSimplifier.ready;
      if (cancelled) return;
      try {
        const group = buildWireBody(scene);
        if (!cancelled) setPrepared(group);
      } catch (err) {
        console.error('Wireframe simplify failed, using raw wireframe', err);
        if (cancelled) return;
        // Fallback: full wireframe on original (dense but loads)
        const model = scene.clone(true);
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.material = new THREE.MeshBasicMaterial({
            color: WIRE_COLOR,
            wireframe: true,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
          });
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);
        const group = new THREE.Group();
        group.add(model);
        if (size.y > 0.0001) group.scale.setScalar(TARGET_HEIGHT / size.y);
        setPrepared(group);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scene]);

  if (!prepared) {
    return (
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color={WIRE_COLOR} wireframe transparent opacity={0.5} />
      </mesh>
    );
  }

  return (
    <group>
      <primitive object={prepared} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.28, 0.48, 64]} />
        <meshBasicMaterial color="#12263f" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

useGLTF.preload(HUMAN_MODEL_URL);
