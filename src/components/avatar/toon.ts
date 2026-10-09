import * as THREE from 'three';

/**
 * Sombreamento "cel" do mundo 3D: rampa de luz em 3 faixas + brilho de borda (rim light).
 * Os materiais são compartilhados por cor para manter poucas variações de shader.
 */

/** Uniforms globais do brilho de borda: a cena ajusta conforme a hora do dia. */
export const rimUniforms = {
  uRimColor: { value: new THREE.Color('#fff4d6') },
  uRimStrength: { value: 0.35 },
};

let gradient: THREE.DataTexture | null = null;
/** Rampa de 3 faixas (sombra, meia-luz, luz) com filtro "nearest" para bordas nítidas. */
export function toonGradient() {
  if (gradient) return gradient;
  const data = new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

function addRim(material: THREE.Material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = rimUniforms.uRimColor;
    shader.uniforms.uRimStrength = rimUniforms.uRimStrength;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform vec3 uRimColor;\nuniform float uRimStrength;\nvoid main() {')
      .replace(
        '#include <opaque_fragment>',
        `float rimDot = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
         float rim = smoothstep(0.62, 0.72, rimDot) * uRimStrength;
         outgoingLight += uRimColor * rim;
         #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => 'toon-rim';
}

const cache = new Map<string, THREE.MeshToonMaterial>();

/** Material cel compartilhado por cor (e opções). */
export function toon(color: string, opts: { transparent?: boolean; opacity?: number; emissive?: string; side?: THREE.Side; vertexColors?: boolean; map?: THREE.Texture | null } = {}) {
  const key = `${color}|${opts.opacity ?? 1}|${opts.emissive ?? ''}|${opts.side ?? 0}|${opts.vertexColors ? 1 : 0}|${opts.map?.uuid ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient(),
    transparent: opts.transparent ?? (opts.opacity !== undefined && opts.opacity < 1),
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ? new THREE.Color(opts.emissive) : undefined,
    side: opts.side ?? THREE.FrontSide,
    vertexColors: opts.vertexColors ?? false,
    map: opts.map ?? null,
  });
  addRim(m);
  cache.set(key, m);
  return m;
}

/** Converte um material importado (ex.: GLB) para o estilo cel, preservando a textura. */
export function toToon(source: THREE.Material): THREE.MeshToonMaterial {
  const s = source as THREE.MeshStandardMaterial;
  const m = new THREE.MeshToonMaterial({
    color: s.color ? s.color.clone() : new THREE.Color('#ffffff'),
    map: s.map ?? null,
    gradientMap: toonGradient(),
    transparent: s.transparent,
    opacity: s.opacity,
    side: s.side,
  });
  if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
  addRim(m);
  return m;
}

/* ---------- Ruído determinístico (terreno, grama, nuvens) ---------- */

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return sum;
}

/** Gerador pseudoaleatório com semente (posições estáveis entre renderizações). */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
