'use client';
import { Outlines } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { toon } from './toon';
import { ToonTree } from './world';

const INK = '#3a2c22';

/** Chuva leve com InstancedMesh (barato em GPU modesta). */
export function Rain({ count = 400, area = 20 }: { count?: number; area?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const drops = useMemo(() => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * area, y: Math.random() * 6, z: (Math.random() - 0.5) * area, s: 6 + Math.random() * 3 })), [count, area]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ camera }, dt) => {
    const m = ref.current;
    if (!m) return;
    m.position.set(camera.position.x, 0, camera.position.z - area / 3);
    drops.forEach((d, i) => {
      d.y -= d.s * dt;
      if (d.y < -1) d.y = 7;
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.z = 0.12;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[0.012, 0.32, 0.012]} />
      <meshBasicMaterial color="#c9dcec" transparent opacity={0.55} />
    </instancedMesh>
  );
}

const STONE = ['#d7ccb6', '#c9bea6', '#e2d8c3', '#cfc2a8'];
const ROOF = ['#c2603a', '#b4532f', '#cc6c42'];

/** Triângulo do oitão (extrudado ao longo da largura da casa). */
function gable(depth: number, height: number) {
  const s = new THREE.Shape();
  s.moveTo(-depth / 2, 0);
  s.lineTo(depth / 2, 0);
  s.lineTo(0, height);
  s.lineTo(-depth / 2, 0);
  return s;
}

/** Casa de pedra galega estilizada (genérica, não reproduz edifícios reais). */
export function StoneHouse({ position, rotation = 0, seed = 0, scale = 1 }: { position: [number, number, number]; rotation?: number; seed?: number; scale?: number }) {
  const w = 2.2 + (seed % 3) * 0.5;
  const h = 1.5 + (seed % 2) * 0.7;
  const d = 1.9;
  const stone = STONE[seed % STONE.length];
  const roof = ROOF[seed % ROOF.length];
  const rh = 0.75;
  const pitch = Math.atan2(rh, d / 2);
  const slab = Math.hypot(rh, d / 2) + 0.35;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={toon(stone)}>
        <boxGeometry args={[w, h, d]} />
        <Outlines thickness={0.03} color={INK} />
      </mesh>
      {/* pedras de canto */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2), h / 2, sz * (d / 2)]} material={toon('#b8ab90')}>
            <boxGeometry args={[0.16, h, 0.16]} />
          </mesh>
        )),
      )}
      {/* telhado de duas águas com beiral e oitão de pedra */}
      <mesh position={[-w / 2, h, 0]} rotation={[0, Math.PI / 2, 0]} material={toon(stone)}>
        <extrudeGeometry args={[gable(d, rh), { depth: w, bevelEnabled: false }]} />
      </mesh>
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[0, h + rh / 2 + 0.04, (sz * d) / 4]} rotation={[sz * pitch, 0, 0]} castShadow material={toon(roof)}>
          <boxGeometry args={[w + 0.45, 0.1, slab]} />
          <Outlines thickness={0.025} color={INK} />
        </mesh>
      ))}
      {/* chaminé */}
      <mesh position={[w / 3, h + 0.6, -0.3]} castShadow material={toon('#b8ab90')}>
        <boxGeometry args={[0.28, 0.6, 0.28]} />
      </mesh>
      {/* porta e janelas com moldura */}
      <mesh position={[0.35, 0.55, d / 2 + 0.01]} material={toon('#6b4429')}>
        <boxGeometry args={[0.5, 1.05, 0.04]} />
      </mesh>
      {[-w / 4, w / 4 + 0.1].map((x, i) =>
        i === 1 && h < 1.8 ? null : (
          <group key={x} position={[i === 0 ? -w / 4 : x, h * 0.62 + (i ? 0.25 : 0), d / 2 + 0.01]}>
            <mesh material={toon('#f2ead8')}>
              <boxGeometry args={[0.46, 0.5, 0.03]} />
            </mesh>
            <mesh position={[0, 0, 0.01]} material={toon('#3b5568')}>
              <boxGeometry args={[0.34, 0.38, 0.03]} />
            </mesh>
            <mesh position={[0, -0.3, 0.05]} material={toon('#d36b9a')}>
              <boxGeometry args={[0.44, 0.12, 0.12]} />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}

/** Hórreo galego estilizado (celeiro sobre pilares). */
export function Horreo({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.8, 0.8].map((x) =>
        [-0.32, 0.32].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, 0.38, 0]} castShadow material={toon('#c4b89f')}>
              <cylinderGeometry args={[0.09, 0.12, 0.76, 8]} />
            </mesh>
            <mesh position={[0, 0.8, 0]} material={toon('#c4b89f')}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 10]} />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[0, 1.15, 0]} castShadow material={toon('#a3683e')}>
        <boxGeometry args={[2.1, 0.6, 0.85]} />
        <Outlines thickness={0.025} color={INK} />
      </mesh>
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
        <mesh key={x} position={[x, 1.15, 0.43]} material={toon('#7f4f2e')}>
          <boxGeometry args={[0.05, 0.58, 0.02]} />
        </mesh>
      ))}
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[0, 1.62, sz * 0.25]} rotation={[sz * -0.75, 0, 0]} castShadow material={toon('#c2603a')}>
          <boxGeometry args={[2.35, 0.07, 0.72]} />
          <Outlines thickness={0.02} color={INK} />
        </mesh>
      ))}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 2.0, 0]} material={toon('#d7ccb6')}>
          <boxGeometry args={[0.06, 0.32, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

/** Marco do Caminho com a vieira e a seta amarela. */
export function Milestone({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow material={toon('#cfc7b5')}>
        <boxGeometry args={[0.36, 1.1, 0.26]} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      <mesh position={[0, 0.84, 0.135]} material={toon('#24538a')}>
        <boxGeometry args={[0.26, 0.26, 0.01]} />
      </mesh>
      {[-0.6, -0.3, 0, 0.3, 0.6].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.05, 0.86 - Math.cos(a) * 0.05, 0.142]} rotation={[0, 0, a]} material={toon('#f2c230', { emissive: '#3a2a00' })}>
          <boxGeometry args={[0.018, 0.12, 0.01]} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.135]} material={toon('#f2c230', { emissive: '#3a2a00' })}>
        <boxGeometry args={[0.2, 0.035, 0.01]} />
      </mesh>
      <mesh position={[0.1, 0.5, 0.135]} rotation={[0, 0, -Math.PI / 2]} material={toon('#f2c230', { emissive: '#3a2a00' })}>
        <coneGeometry args={[0.04, 0.06, 3]} />
      </mesh>
    </group>
  );
}

/** Mantido por compatibilidade: árvores agora vêm do mundo cel. */
export function Tree({ position, kind = 'round', scale = 1 }: { position: [number, number, number]; kind?: 'round' | 'pine' | 'eucalyptus'; scale?: number }) {
  return <ToonTree position={position} kind={kind} scale={scale} seed={Math.round(position[0] * 7 + position[2] * 3)} />;
}

/** Cruzeiro de pedra (cruceiro) genérico. */
export function Cruceiro({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0.12 + i * 0.22, 0]} material={toon('#c4bba8')}>
          <boxGeometry args={[0.9 - i * 0.3, 0.22, 0.9 - i * 0.3]} />
          <Outlines thickness={0.02} color={INK} />
        </mesh>
      ))}
      <mesh position={[0, 1.5, 0]} castShadow material={toon('#c4bba8')}>
        <cylinderGeometry args={[0.07, 0.09, 2.2, 8]} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      <mesh position={[0, 2.5, 0]} material={toon('#c4bba8')}>
        <boxGeometry args={[0.55, 0.1, 0.1]} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
    </group>
  );
}

/** Arco de pedra na entrada da cidade de chegada. */
export function CityGate({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const stone = '#d2c7b1';
  const arch = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-2.6, 0);
    shape.lineTo(-2.6, 4.4);
    shape.lineTo(2.6, 4.4);
    shape.lineTo(2.6, 0);
    shape.lineTo(1.5, 0);
    shape.lineTo(1.5, 2.4);
    shape.absarc(0, 2.4, 1.5, 0, Math.PI, false);
    shape.lineTo(-1.5, 0);
    shape.lineTo(-2.6, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, curveSegments: 18 });
    g.translate(0, 0, -0.45);
    return g;
  }, []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={arch} castShadow receiveShadow material={toon(stone)}>
        <Outlines thickness={0.04} color={INK} />
      </mesh>
      {[-2.2, -1.1, 0, 1.1, 2.2].map((x) => (
        <mesh key={x} position={[x, 4.65, 0]} castShadow material={toon(stone)}>
          <boxGeometry args={[0.55, 0.5, 0.95]} />
          <Outlines thickness={0.03} color={INK} />
        </mesh>
      ))}
      {/* vieira dourada no topo */}
      <mesh position={[0, 3.55, 0.5]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.3, 1.1]} material={toon('#e7b93a', { emissive: '#5a3c00' })}>
        <sphereGeometry args={[0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Outlines thickness={0.02} color="#6b4a12" />
      </mesh>
      {/* estandartes */}
      {[-2.75, 2.75].map((x) => (
        <mesh key={x} position={[x, 3.2, 0.5]} material={toon('#9d2f2a', { side: THREE.DoubleSide })}>
          <planeGeometry args={[0.6, 1.6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Silhueta estilizada de catedral com duas torres (chegada a Santiago). */
export function CathedralSilhouette({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const c = '#d2c2a0';
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 5, 0]} material={toon(c)}>
        <boxGeometry args={[10, 10, 6]} />
      </mesh>
      <mesh position={[0, 11.5, 0.5]} material={toon(c)}>
        <coneGeometry args={[2.2, 4, 4]} />
      </mesh>
      {[-4.2, 4.2].map((x) => (
        <group key={x} position={[x, 0, 1]}>
          <mesh position={[0, 9, 0]} material={toon(c)}>
            <boxGeometry args={[2.8, 18, 2.8]} />
          </mesh>
          <mesh position={[0, 19.5, 0]} material={toon(c)}>
            <boxGeometry args={[2.2, 3, 2.2]} />
          </mesh>
          <mesh position={[0, 22.5, 0]} material={toon('#a8977a')}>
            <coneGeometry args={[1.3, 3, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
