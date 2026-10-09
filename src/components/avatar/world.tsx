'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { fbm, seeded, toon } from './toon';

/* ---------------------------------------------------------------------------
 * Mundo 3D estilizado: terreno com relevo, céu pintado, grama ao vento, árvores.
 * Tudo procedural (sem downloads), com dois níveis de qualidade.
 * ------------------------------------------------------------------------- */

export type Quality = 'low' | 'high';

/** Pontos de controle da trilha (coordenadas da cena). */
export const TRAIL_POINTS: [number, number][] = [
  [-2, 46],
  [3, 34],
  [-2, 22],
  [2, 10],
  [-1, -2],
  [3, -14],
  [0, -26],
  [-1, -36],
];

export function makeTrail() {
  return new THREE.CatmullRomCurve3(TRAIL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)));
}

/** Amostras da trilha (ordenadas por z decrescente) para medir distância rápido. */
let samples: THREE.Vector2[] | null = null;
function trailSamples() {
  if (samples) return samples;
  const c = makeTrail();
  samples = c.getSpacedPoints(400).map((p) => new THREE.Vector2(p.x, p.z));
  return samples;
}

export function distToTrail(x: number, z: number) {
  const s = trailSamples();
  // busca binária pelo z mais próximo (a trilha desce em z de forma monotônica)
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].y > z) lo = mid;
    else hi = mid;
  }
  let best = Infinity;
  for (let dir = -1; dir <= 1; dir += 2) {
    for (let i = dir < 0 ? lo : hi; i >= 0 && i < s.length; i += dir) {
      const dz = s[i].y - z;
      if (dz * dz > best) break;
      const dx = s[i].x - x;
      const d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
  }
  return Math.sqrt(best);
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Altura do terreno: suave na trilha, colinas fora dela e montanhas ao fundo. */
export function heightAt(x: number, z: number, coastal = false, d = distToTrail(x, z)) {
  const gentle = (fbm(x * 0.025 + 3, z * 0.025 + 7, 3) - 0.5) * 2.2;
  const hills = Math.pow(fbm(x * 0.035 + 11, z * 0.035 - 5, 4), 1.6) * 9 * smooth(3, 22, d);
  const far = smooth(-45, -95, z) * (fbm(x * 0.02, z * 0.02, 3) * 26 + 6);
  let h = gentle + hills + far;
  if (coastal) h -= smooth(-22, -40, x) * 5;
  return h;
}

/* ---------------- Terreno ---------------- */

const GRASS_A = new THREE.Color('#8dbb4f');
const GRASS_B = new THREE.Color('#5d9440');
const GRASS_DRY = new THREE.Color('#b9b257');
const DIRT_EDGE = new THREE.Color('#b99a62');
const ROCK = new THREE.Color('#8f8a7c');
const SAND = new THREE.Color('#e6d3a3');

export function Terrain({ quality, coastal, lush }: { quality: Quality; coastal: boolean; lush: boolean }) {
  const geometry = useMemo(() => {
    const w = 150;
    const l = 200;
    const seg = quality === 'high' ? [180, 240] : [110, 150];
    const g = new THREE.PlaneGeometry(w, l, seg[0], seg[1]);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -30);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = distToTrail(x, z);
      const h = heightAt(x, z, coastal, d);
      pos.setY(i, h);
      const n = fbm(x * 0.08, z * 0.08, 3);
      c.copy(GRASS_B).lerp(GRASS_A, smooth(0.35, 0.65, n));
      if (!lush) c.lerp(GRASS_DRY, smooth(0.55, 0.8, fbm(x * 0.03 + 9, z * 0.03, 2)) * 0.6);
      // rocha nas encostas altas
      c.lerp(ROCK, smooth(9, 18, h) * 0.8);
      if (coastal && h < 0.3) c.lerp(SAND, smooth(0.3, -0.6, h));
      // trilha de terra com borda irregular
      if (d < 3) c.lerp(DIRT_EDGE, smooth(3, 1.2, d) * 0.55);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [quality, coastal, lush]);
  return <mesh geometry={geometry} material={toon('#ffffff', { vertexColors: true })} receiveShadow />;
}

/* ---------------- Trilha de terra (faixa com textura nítida) ---------------- */

function trailTexture() {
  const W = 128;
  const H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(W, H);
  const rnd = seeded(11);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const v = y / H;
      // borda irregular e periódica em v (textura repete ao longo da trilha)
      const wob = (fbm(Math.cos(v * Math.PI * 2) * 3 + u * 0.01, Math.sin(v * Math.PI * 2) * 3 + (u < 0.5 ? 0 : 9), 3) - 0.5) * 0.22;
      const e = Math.abs(u - 0.5) * 2 + wob;
      const i = (y * W + x) * 4;
      if (e > 0.9) {
        img.data[i + 3] = 0;
        continue;
      }
      const n = fbm(u * 18, v * 140, 3);
      let r = 222, gg = 186, b = 132;
      // trilhas de passos mais claras no centro, borda escurecida
      const track = Math.exp(-Math.pow((Math.abs(u - 0.5) - 0.17) / 0.07, 2)) * 14;
      r += track; gg += track; b += track * 0.8;
      const k = (n - 0.5) * 30;
      r += k; gg += k; b += k * 0.8;
      if (e > 0.78) { r -= 34; gg -= 34; b -= 26; }
      if (rnd() > 0.996) { r = 175; gg = 160; b = 140; }
      img.data[i] = r;
      img.data[i + 1] = gg;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function TrailRibbon({ curve, coastal }: { curve: THREE.CatmullRomCurve3; coastal: boolean }) {
  const { geometry, material } = useMemo(() => {
    const segs = 500;
    const across = 6;
    const width = 3.3;
    const length = curve.getLength();
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const nx = -tan.z;
      const nz = tan.x;
      for (let j = 0; j <= across; j++) {
        const a = j / across - 0.5;
        const x = p.x + nx * a * width;
        const z = p.z + nz * a * width;
        pos.push(x, heightAt(x, z, coastal) + 0.035, z);
        uv.push(j / across, (t * length) / 14);
      }
    }
    for (let i = 0; i < segs; i++)
      for (let j = 0; j < across; j++) {
        const a = i * (across + 1) + j;
        const b = a + across + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = toon('#ffffff', { map: trailTexture(), side: THREE.DoubleSide });
    m.alphaTest = 0.5;
    m.polygonOffset = true;
    m.polygonOffsetFactor = -2;
    return { geometry: g, material: m };
  }, [curve, coastal]);
  return <mesh geometry={geometry} material={material} receiveShadow />;
}

/* ---------------- Céu pintado ---------------- */

const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // sempre ao fundo
}`;

const skyFragment = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uCloudLit; uniform vec3 uCloudShade;
uniform float uTime; uniform float uCover; uniform float uStars;
varying vec3 vDir;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.55, y));
  col = mix(uBottom, col, smoothstep(-0.15, 0.02, y));
  // sol e halo
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(s, 12.0) * 0.35 + pow(s, 120.0) * 0.6);
  col = mix(col, uSunColor * 1.2 + 0.2, smoothstep(0.9993, 0.9996, s));
  // estrelas
  if (uStars > 0.0) {
    vec2 sp = d.xz / (y + 0.4) * 90.0;
    float st = step(0.996, h(floor(sp))) * smoothstep(0.05, 0.3, y);
    col += st * uStars;
  }
  // nuvens em duas faixas (estilo pintado)
  if (y > 0.0) {
    vec2 uv = d.xz / (y + 0.18) * 1.4 + vec2(uTime * 0.006, uTime * 0.002);
    float c = fbm(uv);
    float mask = smoothstep(1.0 - uCover, 1.08 - uCover, c) * smoothstep(0.0, 0.18, y);
    float lit = smoothstep(0.45, 0.55, fbm(uv * 1.3 + 4.0) + dot(d.xz, normalize(uSunDir.xz)) * 0.2);
    vec3 cc = mix(uCloudShade, uCloudLit, lit);
    col = mix(col, cc, mask * 0.95);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export interface SkyLook {
  top: string;
  horizon: string;
  bottom: string;
  sun: string;
  cloudLit: string;
  cloudShade: string;
  cover: number;
  stars: number;
}

export function PaintedSky({ look, sunDir, animate }: { look: SkyLook; sunDir: THREE.Vector3; animate: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uBottom: { value: new THREE.Color() },
          uSunDir: { value: new THREE.Vector3() },
          uSunColor: { value: new THREE.Color() },
          uCloudLit: { value: new THREE.Color() },
          uCloudShade: { value: new THREE.Color() },
          uTime: { value: 0 },
          uCover: { value: 0.45 },
          uStars: { value: 0 },
        },
      }),
    [],
  );
  const u = material.uniforms;
  u.uTop.value.set(look.top);
  u.uHorizon.value.set(look.horizon);
  u.uBottom.value.set(look.bottom);
  u.uSunColor.value.set(look.sun);
  u.uCloudLit.value.set(look.cloudLit);
  u.uCloudShade.value.set(look.cloudShade);
  u.uCover.value = look.cover;
  u.uStars.value = look.stars;
  u.uSunDir.value.copy(sunDir);
  useFrame((_, dt) => {
    if (animate) u.uTime.value += dt;
    ref.current?.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  );
}

/* ---------------- Grama ao vento ---------------- */

const grassVertex = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
uniform float uTime; uniform float uWind;
varying float vH; varying float vVar;
void main() {
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  float hgt = uv.y;
  float phase = uTime * 1.8 + world.x * 0.32 + world.z * 0.21;
  float gust = sin(uTime * 0.6 + world.x * 0.05 + world.z * 0.04) * 0.5 + 0.5;
  float bend = (sin(phase) * 0.5 + 0.5) * (0.25 + gust * 0.75) * uWind;
  world.x += bend * hgt * hgt * 0.45;
  world.z += bend * hgt * hgt * 0.18;
  vH = hgt;
  vVar = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const grassFragment = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform vec3 uBase; uniform vec3 uTip; uniform vec3 uTipAlt; uniform float uLight;
varying float vH; varying float vVar;
void main() {
  vec3 tip = mix(uTip, uTipAlt, step(0.82, vVar));
  vec3 col = mix(uBase, tip, smoothstep(0.0, 1.0, vH)) * (0.88 + vVar * 0.2) * uLight;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

function bladeGeometry() {
  const g = new THREE.PlaneGeometry(0.09, 1, 1, 4);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + 0.5; // 0..1
    pos.setX(i, pos.getX(i) * (1 - y * 0.85));
    pos.setY(i, y);
  }
  g.computeVertexNormals();
  return g;
}

export function Grass({ quality, coastal, lush, light, animate, wind = 1 }: { quality: Quality; coastal: boolean; lush: boolean; light: number; animate: boolean; wind?: number }) {
  const count = quality === 'high' ? 40000 : 14000;
  const { mesh, material } = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: grassVertex,
      fragmentShader: grassFragment,
      side: THREE.DoubleSide,
      fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uTime: { value: 0 },
          uWind: { value: 1 },
          uBase: { value: new THREE.Color('#3f6f2c') },
          uTip: { value: new THREE.Color(lush ? '#a8d45c' : '#b9d062') },
          uTipAlt: { value: new THREE.Color('#e9e2a0') },
          uLight: { value: 1 },
        },
      ]),
    });
    const mesh = new THREE.InstancedMesh(bladeGeometry(), material, count);
    const rnd = seeded(7);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < count * 6) {
      guard++;
      const x = (rnd() - 0.5) * 60;
      const z = 50 - rnd() * 100;
      const d = distToTrail(x, z);
      if (d < 1.55 + rnd() * 0.4) continue;
      // mais densa perto da trilha (onde a câmera olha)
      if (rnd() > 1.15 - d / 30) continue;
      const h = heightAt(x, z, coastal, d);
      if (h > 10 || (coastal && h < 0.2)) continue;
      // tufos: agrupa pelo ruído
      if (fbm(x * 0.25, z * 0.25, 2) < (d < 6 ? 0.3 : 0.4)) continue;
      p.set(x, h - 0.02, z);
      e.set((rnd() - 0.5) * 0.3, rnd() * Math.PI, (rnd() - 0.5) * 0.3);
      q.setFromEuler(e);
      const sc = 0.22 + rnd() * 0.3;
      s.set(1 + rnd() * 0.6, sc, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(placed++, m);
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return { mesh, material };
  }, [count, coastal, lush]);
  material.uniforms.uLight.value = light;
  material.uniforms.uWind.value = wind;
  useFrame((_, dt) => {
    if (animate) material.uniforms.uTime.value += dt;
  });
  return <primitive object={mesh} />;
}

/** Flores pequenas espalhadas (pontos de cor na grama). */
export function Flowers({ coastal, count = 900 }: { coastal: boolean; count?: number }) {
  const mesh = useMemo(() => {
    const colors = ['#ffffff', '#f6d44a', '#e9a3c0', '#b9a7f0'];
    const geo = new THREE.IcosahedronGeometry(0.07, 0);
    const im = new THREE.InstancedMesh(geo, toon('#ffffff'), count);
    const rnd = seeded(21);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let n = 0;
    for (let i = 0; i < count * 4 && n < count; i++) {
      const x = (rnd() - 0.5) * 50;
      const z = 45 - rnd() * 90;
      const d = distToTrail(x, z);
      if (d < 1.8 || d > 18) continue;
      if (fbm(x * 0.15 + 40, z * 0.15, 2) < 0.52) continue;
      const h = heightAt(x, z, coastal, d);
      if (coastal && h < 0.3) continue;
      m.makeTranslation(x, h + 0.28 + rnd() * 0.15, z);
      im.setMatrixAt(n, m);
      im.setColorAt(n, c.set(colors[Math.floor(rnd() * colors.length)]));
      n++;
    }
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    return im;
  }, [count, coastal]);
  return <primitive object={mesh} />;
}

/* ---------------- Vegetação e elementos ---------------- */

const LEAF = ['#5f9a3e', '#6fa847', '#4f8a38', '#7cb352'];

export function ToonTree({ position, kind = 'round', scale = 1, seed = 1 }: { position: [number, number, number]; kind?: 'round' | 'pine' | 'eucalyptus'; scale?: number; seed?: number }) {
  const rnd = useMemo(() => seeded(seed * 97 + 3), [seed]);
  const blobs = useMemo(() => {
    const out: { p: [number, number, number]; r: number; c: string }[] = [];
    const n = kind === 'round' ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd();
      const rad = i === 0 ? 0 : 0.55;
      out.push({ p: [Math.cos(a) * rad, (kind === 'eucalyptus' ? 2.6 : 2.1) + (i === 0 ? 0.45 : rnd() * 0.4), Math.sin(a) * rad], r: (i === 0 ? 0.95 : 0.7) * (0.85 + rnd() * 0.3), c: LEAF[Math.floor(rnd() * LEAF.length)] });
    }
    return out;
  }, [kind, rnd]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, kind === 'eucalyptus' ? 1.3 : 0.9, 0]} castShadow material={toon('#7a5638')}>
        <cylinderGeometry args={[0.1, 0.18, kind === 'eucalyptus' ? 2.6 : 1.9, 7]} />
      </mesh>
      {kind === 'pine'
        ? [0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 1.7 + i * 0.75, 0]} castShadow material={toon(i % 2 ? '#3f6e3a' : '#36613a')}>
              <coneGeometry args={[1.1 - i * 0.28, 1.4, 8]} />
            </mesh>
          ))
        : blobs.map((b, i) => (
            <mesh key={i} position={b.p} scale={kind === 'eucalyptus' ? [b.r * 0.75, b.r * 1.25, b.r * 0.75] : b.r} castShadow material={toon(kind === 'eucalyptus' ? '#86a874' : b.c)}>
              <icosahedronGeometry args={[1, 1]} />
            </mesh>
          ))}
    </group>
  );
}

export function Rock({ position, scale = 1, seed = 1 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  return (
    <mesh position={position} scale={[scale * 1.2, scale * 0.7, scale]} rotation={[0, seed, 0]} castShadow receiveShadow material={toon('#a7a294')}>
      <dodecahedronGeometry args={[0.6, 0]} />
    </mesh>
  );
}

/** Partículas de luz (pólen de dia, vaga-lumes à noite). */
export function Motes({ count = 120, color = '#fff2b0', area = 26, animate }: { count?: number; color?: string; area?: number; animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const geo = useMemo(() => {
    const rnd = seeded(5);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) arr.set([(rnd() - 0.5) * area, rnd() * 4 + 0.3, (rnd() - 0.5) * area], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count, area]);
  useFrame(({ clock }) => {
    const p = ref.current;
    if (!p) return;
    p.position.set(camera.position.x, 0, camera.position.z - 10);
    if (animate) {
      p.rotation.y = clock.getElapsedTime() * 0.02;
      p.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
    }
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={color} size={0.08} sizeAttenuation transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
