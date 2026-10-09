'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { AvatarConfiguration, RouteStop } from '@/lib/domain/types';
import type { TimeOfDay } from '@/lib/journey';
import { PilgrimModel, type PilgrimAction, type WeatherMood } from './PilgrimModel';
import { CathedralSilhouette, CityGate, Cruceiro, Horreo, Milestone, Rain, StoneHouse } from './SceneBits';
import { rimUniforms, seeded, toon } from './toon';
import { distToTrail, Flowers, Grass, heightAt, makeTrail, Motes, PaintedSky, Rock, Terrain, ToonTree, TrailRibbon, type Quality, type SkyLook } from './world';

export type { TimeOfDay };
type Region = RouteStop['region'];

/** Aparência do céu e da luz por hora local (paleta pintada, estilo aventura). */
const LOOK: Record<TimeOfDay, SkyLook & { fog: string; sunDir: [number, number, number]; sunI: number; amb: string; ambI: number; rim: string; grass: number }> = {
  dawn: { top: '#6c8fcc', horizon: '#f8c99c', bottom: '#c9b49a', sun: '#ffcf8a', cloudLit: '#ffe2c2', cloudShade: '#c99c9c', cover: 0.4, stars: 0, fog: '#e8c9ac', sunDir: [0.85, 0.18, -0.5], sunI: 2.0, amb: '#ffd9b8', ambI: 0.9, rim: '#ffd6a0', grass: 0.95 },
  day: { top: '#3f8fdc', horizon: '#cfe7f2', bottom: '#a8c7cf', sun: '#fff1c9', cloudLit: '#ffffff', cloudShade: '#b9c9de', cover: 0.42, stars: 0, fog: '#c3dde9', sunDir: [0.5, 0.65, 0.45], sunI: 2.6, amb: '#e6f0ff', ambI: 1.05, rim: '#fff6dc', grass: 1.05 },
  dusk: { top: '#3d4b8c', horizon: '#f39b6a', bottom: '#b07a6a', sun: '#ffaa66', cloudLit: '#ffc79c', cloudShade: '#8a6a8c', cover: 0.45, stars: 0.05, fog: '#d99a82', sunDir: [-0.85, 0.16, -0.5], sunI: 1.9, amb: '#ffc1a0', ambI: 0.8, rim: '#ffb27a', grass: 0.85 },
  night: { top: '#0b1430', horizon: '#2a3c66', bottom: '#1b2540', sun: '#a9bcff', cloudLit: '#4b5b84', cloudShade: '#1f2944', cover: 0.35, stars: 0.9, fog: '#22325a', sunDir: [0.3, 0.6, 0.4], sunI: 0.55, amb: '#7d8fc4', ambI: 0.55, rim: '#a9c1ff', grass: 0.45 },
};

const RAIN_LOOK: Partial<SkyLook> & { fog: string } = { top: '#7b8894', horizon: '#b8c2c8', bottom: '#8e9aa1', cloudLit: '#cfd6db', cloudShade: '#8b969f', cover: 0.95, fog: '#aab5bc' };

/** Qualidade gráfica: alta em computadores e celulares potentes. */
function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'low';
  const forced = new URLSearchParams(window.location.search).get('gfx');
  if (forced === 'high' || forced === 'low') return forced;
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency ?? 4;
  return !mobile && cores >= 4 ? 'high' : 'low';
}

function Walker({ curve, config, action, weather, animate, progress, souvenirs, coastal, sunDir, quality, sunIntensity, sunColor }: { curve: THREE.CatmullRomCurve3; config: AvatarConfiguration; action: PilgrimAction; weather: WeatherMood; animate: boolean; progress?: number; souvenirs?: number; coastal: boolean; sunDir: THREE.Vector3; quality: Quality; sunIntensity: number; sunColor: string }) {
  const ref = useRef<THREE.Group>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const t = useRef(progress ?? 0.12);
  const { camera } = useThree();
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const first = useRef(true);
  useFrame((_, dt) => {
    if (progress !== undefined) t.current = THREE.MathUtils.lerp(t.current, 0.04 + progress * 0.86, first.current ? 1 : 0.05);
    else if (animate && action === 'walk') t.current = (t.current + dt * 0.0085) % 0.9;
    const u = t.current;
    const p = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const y = heightAt(p.x, p.z, coastal, 0);
    if (ref.current) {
      ref.current.position.set(p.x, y, p.z);
      ref.current.rotation.y = Math.atan2(tan.x, tan.z);
    }
    // câmera de aventura: atrás, levemente ao lado e acima, olhando adiante
    camPos.set(p.x - tan.x * 6.4 + 1.8, y + 2.7, p.z - tan.z * 6.4);
    camPos.y = Math.max(camPos.y, heightAt(camPos.x, camPos.z, coastal) + 1.2);
    camera.position.lerp(camPos, first.current || !animate ? 1 : 0.05);
    look.set(p.x + tan.x * 5, y + 1.25, p.z + tan.z * 5);
    camera.lookAt(look);
    if (sun.current) {
      sun.current.position.set(p.x + sunDir.x * 40, y + sunDir.y * 40, p.z + sunDir.z * 40);
      sun.current.target.position.set(p.x, y, p.z);
      sun.current.target.updateMatrixWorld();
    }
    first.current = false;
  });
  return (
    <>
      <directionalLight ref={sun} intensity={sunIntensity} color={sunColor} castShadow shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-camera-far={120} shadow-bias={-0.0006} shadow-normalBias={0.04} />
      <group ref={ref}>
        <PilgrimModel config={config} action={action} weather={weather} animate={animate} souvenirs={souvenirs} />
      </group>
    </>
  );
}

/** Outros peregrinos (com consentimento) à frente e atrás, sem posição real. */
function Companions({ curve, configs, weather, animate, around, coastal }: { curve: THREE.CatmullRomCurve3; configs: AvatarConfiguration[]; weather: WeatherMood; animate: boolean; around: number; coastal: boolean }) {
  return (
    <>
      {configs.slice(0, 4).map((c, i) => {
        const u = THREE.MathUtils.clamp(around + (i % 2 ? -1 : 1) * (0.035 + i * 0.03), 0.02, 0.95);
        const p = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const side = i % 2 ? 0.6 : -0.6;
        const x = p.x - tan.z * side;
        const z = p.z + tan.x * side;
        return (
          <group key={i} position={[x, heightAt(x, z, coastal, 0), z]} rotation={[0, Math.atan2(tan.x, tan.z), 0]}>
            <PilgrimModel config={c} action="walk" weather={weather} animate={animate} outline={false} />
          </group>
        );
      })}
    </>
  );
}

function Scenery({ region, curve, coastal, quality }: { region: Region; curve: THREE.CatmullRomCurve3; coastal: boolean; quality: Quality }) {
  const galician = region !== 'minho' && region !== 'porto';
  const items = useMemo(() => {
    const rnd = seeded(region.length * 13 + 5);
    const out: { kind: 'house' | 'horreo' | 'tree' | 'pine' | 'euc' | 'rock'; pos: [number, number, number]; rot: number; seed: number; scale: number }[] = [];
    const place = (x: number, z: number) => [x, heightAt(x, z, coastal), z] as [number, number, number];
    // aldeias ao longo da trilha
    for (const u of [0.22, 0.55]) {
      const p = curve.getPointAt(u);
      const tan = curve.getTangentAt(u);
      for (let k = 0; k < 4; k++) {
        const side = k % 2 ? 1 : -1;
        const along = (k - 1.5) * 3.4;
        const off = 5 + rnd() * 1.5;
        const x = p.x + tan.x * along - tan.z * side * off;
        const z = p.z + tan.z * along + tan.x * side * off;
        out.push({ kind: k === 3 && galician ? 'horreo' : 'house', pos: place(x, z), rot: Math.atan2(tan.x, tan.z) + (side > 0 ? -Math.PI / 2 : Math.PI / 2), seed: k + Math.round(u * 10), scale: 1 });
      }
    }
    // árvores e pedras espalhadas
    const n = quality === 'high' ? 110 : 60;
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * 80;
      const z = 48 - rnd() * 110;
      const d = distToTrail(x, z);
      if (d < 6.5) continue;
      const h = heightAt(x, z, coastal, d);
      if (coastal && h < 0.3) continue;
      const r = rnd();
      const kind = r < 0.12 ? 'rock' : galician ? (r < 0.45 ? 'pine' : r < 0.6 ? 'euc' : 'tree') : r < 0.3 ? 'euc' : 'tree';
      out.push({ kind, pos: [x, h, z], rot: rnd() * 6, seed: i, scale: 0.8 + rnd() * 0.7 });
    }
    return out;
  }, [region, curve, coastal, galician, quality]);

  return (
    <>
      {items.map((it, i) =>
        it.kind === 'house' ? (
          <StoneHouse key={i} position={it.pos} rotation={it.rot} seed={it.seed} />
        ) : it.kind === 'horreo' ? (
          <Horreo key={i} position={it.pos} rotation={it.rot} />
        ) : it.kind === 'rock' ? (
          <Rock key={i} position={it.pos} scale={it.scale} seed={it.seed} />
        ) : (
          <ToonTree key={i} position={it.pos} kind={it.kind === 'pine' ? 'pine' : it.kind === 'euc' ? 'eucalyptus' : 'round'} scale={it.scale} seed={it.seed} />
        ),
      )}
      {(() => {
        const g = curve.getPointAt(0.84);
        const tan = curve.getTangentAt(0.84);
        return <CityGate position={[g.x, heightAt(g.x, g.z, coastal, 0) - 0.05, g.z]} rotation={Math.atan2(tan.x, tan.z)} />;
      })()}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = -9 + i * 3.6;
        const z = -42 - (i % 2) * 2.5;
        return <StoneHouse key={`v${i}`} position={[x, heightAt(x, z, coastal), z]} seed={i + 3} scale={1.1} />;
      })}
      {region === 'santiago' && <CathedralSilhouette position={[0, heightAt(0, -60, coastal), -60]} scale={1.15} />}
      {[
        [0.12, 2.6, 'cruz'],
        [0.33, -2.3, 'marco'],
        [0.47, 2.2, 'marco'],
        [0.7, -2.4, 'marco'],
      ].map(([u, off, kind], i) => {
        const p = curve.getPointAt(u as number);
        const tan = curve.getTangentAt(u as number);
        const x = p.x - tan.z * (off as number);
        const z = p.z + tan.x * (off as number);
        const pos: [number, number, number] = [x, heightAt(x, z, coastal), z];
        return kind === 'cruz' ? <Cruceiro key={i} position={pos} /> : <Milestone key={i} position={pos} rotation={Math.atan2(tan.x, tan.z) + ((off as number) > 0 ? -1.2 : 1.2)} />;
      })}
      {coastal && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-70, -0.35, -20]} material={toon('#4c9cc4')}>
          <planeGeometry args={[80, 220]} />
        </mesh>
      )}
    </>
  );
}

function Lighting({ look, raining }: { look: (typeof LOOK)[TimeOfDay]; raining: boolean }) {
  rimUniforms.uRimColor.value.set(look.rim);
  rimUniforms.uRimStrength.value = raining ? 0.15 : 0.38;
  return (
    <>
      <hemisphereLight args={[look.amb, '#4f6a3a', look.ambI * (raining ? 0.85 : 1)]} />
      <ambientLight intensity={0.25} color={look.amb} />
    </>
  );
}

/**
 * Mundo de exploração da etapa em estilo cel (relevo, céu pintado, grama ao vento).
 * Não é navegação: o mapa 2D continua sendo a referência.
 */
export default function ExploreScene({
  config,
  region,
  weather,
  action,
  animate,
  progress,
  timeOfDay = 'day',
  companions = [],
  souvenirs = 0,
}: {
  config: AvatarConfiguration;
  region: Region;
  weather: WeatherMood;
  action: PilgrimAction;
  animate: boolean;
  progress?: number;
  timeOfDay?: TimeOfDay;
  companions?: AvatarConfiguration[];
  souvenirs?: number;
}) {
  const curve = useMemo(() => makeTrail(), []);
  const quality = useMemo(detectQuality, []);
  const raining = weather === 'rain';
  const base = LOOK[timeOfDay];
  const sky: SkyLook = raining && timeOfDay !== 'night' ? { ...base, ...RAIN_LOOK } : base;
  const fog = raining && timeOfDay !== 'night' ? RAIN_LOOK.fog : base.fog;
  const sunDir = useMemo(() => new THREE.Vector3(...base.sunDir).normalize(), [base]);
  const coastal = region === 'rias_baixas' || region === 'porto';
  const lush = region !== 'porto';
  return (
    <Canvas
      shadows
      dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
      camera={{ position: [4, 4, 34], fov: 48, near: 0.1, far: 500 }}
      gl={{ powerPreference: quality === 'high' ? 'high-performance' : 'low-power', antialias: true, toneMapping: THREE.NeutralToneMapping }}
      frameloop={animate ? 'always' : 'demand'}
    >
      <fog attach="fog" args={[fog, raining ? 20 : 50, raining ? 110 : 240]} />
      <PaintedSky look={sky} sunDir={sunDir} animate={animate} />
      <Lighting look={base} raining={raining} />
      <Terrain quality={quality} coastal={coastal} lush={lush} />
      <TrailRibbon curve={curve} coastal={coastal} />
      <Grass quality={quality} coastal={coastal} lush={lush} light={base.grass * (raining ? 0.8 : 1)} animate={animate} wind={raining ? 1.8 : 1} />
      <Flowers coastal={coastal} count={quality === 'high' ? 1200 : 500} />
      <Scenery region={region} curve={curve} coastal={coastal} quality={quality} />
      <Walker curve={curve} config={config} action={action} weather={weather} animate={animate} progress={progress} souvenirs={souvenirs} coastal={coastal} sunDir={sunDir} quality={quality} sunIntensity={base.sunI * (raining ? 0.45 : 1)} sunColor={sky.sun} />
      {companions.length > 0 && <Companions curve={curve} configs={companions} weather={weather} animate={animate} around={0.04 + (progress ?? 0.12) * 0.86} coastal={coastal} />}
      {raining && animate && <Rain count={quality === 'high' ? 1400 : 600} area={34} />}
      {!raining && <Motes animate={animate} count={timeOfDay === 'night' ? 160 : 90} color={timeOfDay === 'night' ? '#d8ff8a' : '#fff4c2'} />}
      {quality === 'high' ? (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={timeOfDay === 'night' ? 0.9 : 0.45} luminanceThreshold={0.82} luminanceSmoothing={0.2} />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          <Vignette offset={0.32} darkness={0.55} />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
