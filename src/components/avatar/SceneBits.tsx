'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Chuva leve com InstancedMesh (barato em GPU modesta). */
export function Rain({ count = 400, area = 20 }: { count?: number; area?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const drops = useMemo(() => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * area, y: Math.random() * 6, z: (Math.random() - 0.5) * area, s: 4 + Math.random() * 3 })), [count, area]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    drops.forEach((d, i) => {
      d.y -= d.s * dt;
      if (d.y < -1) d.y = 6;
      dummy.position.set(d.x, d.y, d.z);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.01, 0.18, 0.01]} />
      <meshBasicMaterial color="#7aa0c4" transparent opacity={0.6} />
    </instancedMesh>
  );
}

const STONE = ['#cfc4ae', '#bdb29b', '#d8ccb4', '#e6dfd0'];
const ROOF = ['#b5532f', '#a8492a', '#c0623a'];

/** Casa de pedra estilizada (genérica, não reproduz edifícios reais). */
export function StoneHouse({ position, rotation = 0, seed = 0, scale = 1 }: { position: [number, number, number]; rotation?: number; seed?: number; scale?: number }) {
  const w = 1.6 + (seed % 3) * 0.4;
  const h = 1.1 + (seed % 2) * 0.6;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 1.4]} />
        <meshStandardMaterial color={STONE[seed % STONE.length]} roughness={1} />
      </mesh>
      <mesh position={[0, h + 0.35, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w / 1.15, 1, 1.4 / 1.15]} castShadow>
        <coneGeometry args={[1.05, 0.7, 4]} />
        <meshStandardMaterial color={ROOF[seed % ROOF.length]} roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.45, 0.71]}>
        <boxGeometry args={[0.35, 0.8, 0.02]} />
        <meshStandardMaterial color="#5a3f2a" />
      </mesh>
      <mesh position={[-w / 4, h * 0.65, 0.71]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color="#3e4a52" />
      </mesh>
    </group>
  );
}

/** Hórreo galego estilizado (celeiro sobre pilares). */
export function Horreo({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.7, 0.7].map((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.35, z]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.7, 6]} />
            <meshStandardMaterial color="#bdb29b" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[1.9, 0.5, 0.8]} />
        <meshStandardMaterial color="#cfc4ae" roughness={1} />
      </mesh>
      <mesh position={[0, 1.35, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.6, 1, 0.75]} castShadow>
        <coneGeometry args={[0.85, 0.4, 4]} />
        <meshStandardMaterial color="#a8492a" />
      </mesh>
      <mesh position={[0.95, 1.65, 0]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#bdb29b" />
      </mesh>
    </group>
  );
}

/** Marco do Caminho com a vieira e a seta amarela. */
export function Milestone({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.32, 1, 0.22]} />
        <meshStandardMaterial color="#b8b2a4" roughness={1} />
      </mesh>
      <mesh position={[0, 0.78, 0.115]}>
        <boxGeometry args={[0.22, 0.22, 0.01]} />
        <meshStandardMaterial color="#24405e" />
      </mesh>
      <mesh position={[0, 0.78, 0.125]} rotation={[0, 0, Math.PI]} scale={[1, 1, 0.2]}>
        <coneGeometry args={[0.08, 0.14, 10]} />
        <meshStandardMaterial color="#d4a017" />
      </mesh>
      <mesh position={[0, 0.5, 0.115]}>
        <boxGeometry args={[0.18, 0.03, 0.01]} />
        <meshStandardMaterial color="#d4a017" />
      </mesh>
    </group>
  );
}

export function Tree({ position, kind = 'round', scale = 1 }: { position: [number, number, number]; kind?: 'round' | 'pine' | 'eucalyptus'; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
      {kind === 'pine' ? (
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[0.6, 1.6, 7]} />
          <meshStandardMaterial color="#3f5f37" flatShading />
        </mesh>
      ) : kind === 'eucalyptus' ? (
        <mesh position={[0, 2, 0]} scale={[0.6, 1.4, 0.6]} castShadow>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#7d9a6a" flatShading />
        </mesh>
      ) : (
        <mesh position={[0, 1.5, 0]} castShadow>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#4f6f3f" flatShading />
        </mesh>
      )}
    </group>
  );
}

/** Cruzeiro de pedra (cruceiro) genérico. */
export function Cruceiro({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#b8b2a4" />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2, 8]} />
        <meshStandardMaterial color="#b8b2a4" />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
        <meshStandardMaterial color="#b8b2a4" />
      </mesh>
    </group>
  );
}

/** Arco de pedra na entrada da cidade de chegada. */
export function CityGate({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const stone = '#c9c0ae';
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} position={[x, 1.6, 0]} castShadow>
          <boxGeometry args={[0.7, 3.2, 0.7]} />
          <meshStandardMaterial color={stone} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 3.45, 0]} castShadow>
        <boxGeometry args={[4.5, 0.6, 0.8]} />
        <meshStandardMaterial color={stone} roughness={0.95} />
      </mesh>
      {/* vieira dourada no topo */}
      <mesh position={[0, 3.6, 0.42]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.3, 1.1]}>
        <sphereGeometry args={[0.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d4a017" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Silhueta estilizada de catedral com duas torres (chegada a Santiago). */
export function CathedralSilhouette({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const c = '#b9ab92';
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[9, 8, 5]} />
        <meshStandardMaterial color={c} roughness={1} />
      </mesh>
      {[-3.6, 3.6].map((x) => (
        <group key={x} position={[x, 0, 1]}>
          <mesh position={[0, 8, 0]}>
            <boxGeometry args={[2.4, 16, 2.4]} />
            <meshStandardMaterial color={c} roughness={1} />
          </mesh>
          <mesh position={[0, 17.5, 0]}>
            <coneGeometry args={[1.4, 3, 8]} />
            <meshStandardMaterial color="#8f846f" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
