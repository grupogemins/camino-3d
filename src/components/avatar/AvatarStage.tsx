'use client';
import { ContactShadows, OrbitControls, Outlines } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { AvatarConfiguration } from '@/lib/domain/types';
import { PilgrimModel, type PilgrimAction, type WeatherMood } from './PilgrimModel';
import { Milestone, Rain } from './SceneBits';
import { rimUniforms, seeded, toon } from './toon';
import { PaintedSky, ToonTree } from './world';

/** Ilha de grama sob o personagem (palco). */
function Island() {
  const tufts = useMemo(() => {
    const rnd = seeded(3);
    return Array.from({ length: 70 }, () => {
      const a = rnd() * Math.PI * 2;
      const r = 0.55 + rnd() * 1.05;
      return { p: [Math.cos(a) * r, 0.02, Math.sin(a) * r] as [number, number, number], s: 0.5 + rnd() * 0.7, rot: rnd() * 3, c: rnd() > 0.85 ? '#f4d65a' : rnd() > 0.5 ? '#86b84e' : '#6ea543' };
    });
  }, []);
  return (
    <group>
      <mesh position={[0, -0.32, 0]} receiveShadow material={toon('#7fb24b')}>
        <cylinderGeometry args={[1.75, 1.45, 0.62, 40]} />
        <Outlines thickness={0.02} color="#2b211b" />
      </mesh>
      <mesh position={[0, -0.82, 0]} material={toon('#9a7a55')}>
        <cylinderGeometry args={[1.45, 0.6, 0.6, 24]} />
      </mesh>
      <mesh position={[0, 0.005, 0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={toon('#d8b47e')}>
        <circleGeometry args={[0.55, 28]} />
      </mesh>
      {tufts.map((t, i) => (
        <mesh key={i} position={t.p} rotation={[0, t.rot, 0]} scale={[t.s, t.s * 1.4, t.s]} material={toon(t.c)}>
          <coneGeometry args={[0.05, 0.22, 4]} />
        </mesh>
      ))}
      <ToonTree position={[-1.15, 0, -0.9]} scale={0.42} seed={4} />
      <Milestone position={[1.05, 0, -0.55]} rotation={-0.5} />
    </group>
  );
}

const SKY = {
  clear: { top: '#4f9be0', horizon: '#d6ecf3', bottom: '#b5d3d9', sun: '#fff1c9', cloudLit: '#ffffff', cloudShade: '#bccbe0', cover: 0.45, stars: 0 },
  rain: { top: '#7b8894', horizon: '#c0c9ce', bottom: '#98a3aa', sun: '#e6eef5', cloudLit: '#d5dce0', cloudShade: '#8b969f', cover: 0.95, stars: 0 },
};

/** Palco 3D do personagem (tela de personalização). Carregado sob demanda. */
export default function AvatarStage({ config, action, weather, animate }: { config: AvatarConfiguration; action: PilgrimAction; weather: WeatherMood; animate: boolean }) {
  const rain = weather === 'rain';
  const sunDir = useMemo(() => new THREE.Vector3(0.6, 0.5, 0.7).normalize(), []);
  rimUniforms.uRimColor.value.set('#fff3d6');
  rimUniforms.uRimStrength.value = 0.35;
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [1.9, 1.5, 3.4], fov: 36 }} frameloop={animate ? 'always' : 'demand'} gl={{ antialias: true, powerPreference: 'low-power', toneMapping: THREE.NeutralToneMapping }}>
      <PaintedSky look={rain ? SKY.rain : SKY.clear} sunDir={sunDir} animate={animate} />
      <hemisphereLight args={['#eef5ff', '#5f7a45', rain ? 0.9 : 1.1]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 3.5]} intensity={rain ? 1.2 : 2.6} color="#fff4dc" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} shadow-normalBias={0.03} />
      <group position={[0, -0.95, 0]} rotation={[0, action === 'walk' ? 0.55 : 0.3, 0]}>
        <Island />
        <PilgrimModel config={config} action={action} weather={weather} animate={animate} />
        <ContactShadows opacity={0.35} scale={3} blur={2.2} far={1.5} />
      </group>
      {rain && animate && <Rain area={5} count={300} />}
      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={6} minPolarAngle={0.7} maxPolarAngle={1.5} target={[0, 0, 0]} />
    </Canvas>
  );
}
