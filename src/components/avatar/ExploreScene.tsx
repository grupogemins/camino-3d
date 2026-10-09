'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { AvatarConfiguration, RouteStop } from '@/lib/domain/types';
import { PilgrimModel, type PilgrimAction, type WeatherMood } from './PilgrimModel';
import { Cruceiro, Horreo, Milestone, Rain, StoneHouse, Tree } from './SceneBits';

type Region = RouteStop['region'];

/** Caminho em curva suave (estilizado) ao longo do qual o peregrino caminha. */
function useTrail() {
  return useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          [-2, 0, 40],
          [3, 0, 28],
          [-2, 0, 16],
          [2, 0, 4],
          [-1, 0, -8],
          [3, 0, -20],
          [0, 0, -34],
        ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      ),
    [],
  );
}

function TrailMesh({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const geometry = useMemo(() => {
    const pts = curve.getSpacedPoints(160);
    const positions: number[] = [];
    const indices: number[] = [];
    const halfWidth = 1.1;
    pts.forEach((p, i) => {
      const t = curve.getTangentAt(i / 160);
      const n = new THREE.Vector3(-t.z, 0, t.x).normalize();
      positions.push(p.x + n.x * halfWidth, 0.02, p.z + n.z * halfWidth, p.x - n.x * halfWidth, 0.02, p.z - n.z * halfWidth);
      if (i < pts.length - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [curve]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#cfae80" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Walker({ curve, config, action, weather, animate, progress }: { curve: THREE.CatmullRomCurve3; config: AvatarConfiguration; action: PilgrimAction; weather: WeatherMood; animate: boolean; progress?: number }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(progress ?? 0.15);
  const { camera } = useThree();
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    if (progress !== undefined) t.current = THREE.MathUtils.lerp(t.current, 0.05 + progress * 0.9, 0.05);
    else if (animate && action === 'walk') t.current = (t.current + dt * 0.012) % 0.95;
    const p = curve.getPointAt(t.current);
    const tan = curve.getTangentAt(t.current);
    if (ref.current) {
      ref.current.position.copy(p);
      ref.current.rotation.y = Math.atan2(-tan.x, -tan.z);
    }
    // câmera em terceira pessoa, por trás e acima (como nas fotos de referência)
    camTarget.set(p.x - tan.x * 6 + 1.5, 3.4, p.z - tan.z * 6);
    camera.position.lerp(camTarget, animate ? 0.06 : 1);
    camera.lookAt(p.x + tan.x * 4, 1.2, p.z + tan.z * 4);
  });
  return (
    <group ref={ref}>
      <group rotation={[0, Math.PI, 0]}>
        <PilgrimModel config={config} action={action} weather={weather} animate={animate} />
      </group>
    </group>
  );
}

function Scenery({ region, curve }: { region: Region; curve: THREE.CatmullRomCurve3 }) {
  const coastal = region === 'rias_baixas' || region === 'porto';
  const galician = region !== 'minho' && region !== 'porto';
  const items = useMemo(() => {
    const out: { kind: 'house' | 'tree' | 'horreo' | 'pine'; pos: [number, number, number]; rot: number; seed: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const u = (i + 0.5) / 26;
      const p = curve.getPointAt(u);
      const side = i % 2 === 0 ? 1 : -1;
      const off = 4 + ((i * 37) % 7);
      const kind = i % 5 === 0 ? 'house' : i % 7 === 0 && galician ? 'horreo' : galician && i % 3 === 0 ? 'pine' : 'tree';
      out.push({ kind, pos: [p.x + side * off, 0, p.z + ((i * 13) % 5) - 2], rot: side > 0 ? -Math.PI / 2 : Math.PI / 2, seed: i });
    }
    return out;
  }, [curve, galician]);
  return (
    <>
      {items.map((it, i) =>
        it.kind === 'house' ? (
          <StoneHouse key={i} position={it.pos} rotation={it.rot} seed={it.seed} />
        ) : it.kind === 'horreo' ? (
          <Horreo key={i} position={it.pos} rotation={it.rot} />
        ) : (
          <Tree key={i} position={it.pos} kind={it.kind === 'pine' ? 'pine' : i % 4 === 0 ? 'eucalyptus' : 'round'} scale={0.9 + (i % 3) * 0.2} />
        ),
      )}
      {/* vila ao fundo */}
      {[0, 1, 2, 3, 4].map((i) => (
        <StoneHouse key={`v${i}`} position={[-6 + i * 3, 0, -40 - (i % 2) * 2]} seed={i + 3} scale={1.2} />
      ))}
      <Cruceiro position={[2.5, 0, 10]} />
      <Milestone position={[2.2, 0, 22]} rotation={-0.3} />
      <Milestone position={[-2.4, 0, -14]} rotation={0.4} />
      {coastal && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, 0.01, 0]}>
          <planeGeometry args={[80, 140]} />
          <meshStandardMaterial color="#3d7fa6" roughness={0.3} />
        </mesh>
      )}
      {/* colinas */}
      {[-30, -10, 15, 35].map((x, i) => (
        <mesh key={x} position={[x, -6, -70 - i * 6]} scale={[22, 12 + i * 2, 14]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color={i % 2 ? '#7f9a6b' : '#8fa77a'} roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
}

/**
 * Modo de exploração 3D estilizado da etapa (materiais e formas regionais genéricas).
 * Não é navegação: o mapa 2D continua sendo a referência.
 */
export default function ExploreScene({ config, region, weather, action, animate, progress }: { config: AvatarConfiguration; region: Region; weather: WeatherMood; action: PilgrimAction; animate: boolean; progress?: number }) {
  const curve = useTrail();
  const sky = weather === 'rain' ? '#b9c4ca' : '#f2dfb8';
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [4, 4, 34], fov: 50, far: 200 }} gl={{ powerPreference: 'low-power' }} frameloop={animate ? 'always' : 'demand'}>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 30, 110]} />
      <hemisphereLight args={['#fff1d6', '#5f7f4a', 0.9]} />
      <directionalLight position={[20, 25, 10]} intensity={weather === 'rain' ? 0.5 : 1.3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={region === 'minho' ? '#7a9a5c' : '#6f8f5a'} roughness={1} />
      </mesh>
      <TrailMesh curve={curve} />
      <Scenery region={region} curve={curve} />
      <Walker curve={curve} config={config} action={action} weather={weather} animate={animate} progress={progress} />
      {weather === 'rain' && animate && <Rain count={500} area={30} />}
    </Canvas>
  );
}
