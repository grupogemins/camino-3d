'use client';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { AvatarConfiguration } from '@/lib/domain/types';
import { PilgrimModel, type PilgrimAction, type WeatherMood } from './PilgrimModel';
import { Rain } from './SceneBits';

/** Palco 3D do personagem (tela de personalização). Carregado sob demanda. */
export default function AvatarStage({ config, action, weather, animate }: { config: AvatarConfiguration; action: PilgrimAction; weather: WeatherMood; animate: boolean }) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [1.6, 1.6, 3.2], fov: 40 }} frameloop={animate ? 'always' : 'demand'} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <color attach="background" args={[weather === 'rain' ? '#c9d2d6' : '#f3e7cf']} />
      <hemisphereLight args={['#fff6e0', '#6f8f5a', 0.9]} />
      <directionalLight position={[3, 5, 2]} intensity={weather === 'rain' ? 0.6 : 1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <group position={[0, -0.9, 0]} rotation={[0, action === 'walk' ? 0.6 : 0.25, 0]}>
        <PilgrimModel config={config} action={action} weather={weather} animate={animate} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.6, 48]} />
          <meshStandardMaterial color="#d9b98c" roughness={1} />
        </mesh>
        <ContactShadows opacity={0.35} scale={4} blur={2.5} far={2} />
      </group>
      {weather === 'rain' && animate && <Rain area={4} count={300} />}
      <OrbitControls enablePan={false} minDistance={2.2} maxDistance={6} minPolarAngle={0.6} maxPolarAngle={1.55} target={[0, 0, 0]} />
    </Canvas>
  );
}
