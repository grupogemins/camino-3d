'use client';
import { Outlines, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { AvatarConfiguration } from '@/lib/domain/types';
import { toon } from './toon';

export type PilgrimAction = 'idle' | 'walk' | 'rest' | 'celebrate';
export type WeatherMood = 'clear' | 'rain' | 'cold' | 'hot';

const INK = '#2b211b';
const WIDTH: Record<AvatarConfiguration['bodyType'], number> = { slim: 0.9, average: 1, broad: 1.16 };
const PACK: Record<AvatarConfiguration['backpack'], [number, number, number]> = {
  small: [0.32, 0.36, 0.18],
  medium: [0.38, 0.48, 0.22],
  large: [0.44, 0.6, 0.27],
};

/** Peça com material cel e contorno de tinta. */
function Part({ color, outline = 0.012, children, ...props }: { color: string; outline?: number; children?: ReactNode } & Omit<React.ComponentProps<'mesh'>, 'children'>) {
  return (
    <mesh castShadow material={toon(color)} {...props}>
      {children}
      {outline > 0 && <Outlines thickness={outline} color={INK} />}
    </mesh>
  );
}

function shade(hex: string, k: number) {
  return '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
}

/** Perfil da túnica/casaco (torno). */
function useTunic(width: number, long: boolean) {
  return useMemo(() => {
    const pts = [
      [0.0, long ? -0.36 : -0.18],
      [0.215, long ? -0.36 : -0.18],
      [0.2, -0.1],
      [0.185, 0.05],
      [0.2, 0.22],
      [0.205, 0.34],
      [0.15, 0.43],
      [0.06, 0.46],
      [0.0, 0.46],
    ].map(([r, y]) => new THREE.Vector2(r * width, y));
    const g = new THREE.LatheGeometry(pts, 20);
    g.scale(1, 1, 0.78);
    return g;
  }, [width, long]);
}

function usePoncho(width: number) {
  return useMemo(() => {
    const pts = [
      [0.0, -0.42],
      [0.42, -0.42],
      [0.36, -0.2],
      [0.3, 0.1],
      [0.24, 0.32],
      [0.14, 0.44],
      [0.0, 0.47],
    ].map(([r, y]) => new THREE.Vector2(r * width, y));
    const g = new THREE.LatheGeometry(pts, 22);
    g.scale(1, 1, 1.05);
    g.translate(0, 0, -0.08);
    return g;
  }, [width]);
}

/**
 * Peregrino 3D estilizado (cel-shading + contorno), personalizável peça por peça.
 * Esqueleto simples com joelhos e cotovelos; animações procedurais de caminhar,
 * descansar, comemorar e respirar. Reage ao clima (capa de chuva, gorro, chapéu).
 */
export function PilgrimModel({
  config,
  action = 'idle',
  weather = 'clear',
  animate = true,
  souvenirs = 0,
  outline = true,
}: {
  config: AvatarConfiguration;
  action?: PilgrimAction;
  weather?: WeatherMood;
  animate?: boolean;
  /** Lembranças de cidades alcançadas: broches dourados na mochila. */
  souvenirs?: number;
  /** Contorno de tinta (desligado para figurantes distantes). */
  outline?: boolean;
}) {
  const body = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const thighL = useRef<THREE.Group>(null);
  const thighR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);

  const w = WIDTH[config.bodyType];
  const [pw, ph, pd] = PACK[config.backpack];
  const ol = outline ? 0.011 : 0;
  const rainGear = weather === 'rain' || config.outfit === 'poncho';
  const hat = weather === 'cold' ? 'beanie' : weather === 'hot' && config.hat === 'none' ? 'sun_hat' : config.hat;
  const shorts = config.outfit === 'tshirt_shorts';
  const lowerColor = shorts ? '#7a6548' : config.outfit === 'dress_leggings' ? '#2f2f36' : '#5d4d3a';
  const shoeColor = config.shoes === 'boots' ? '#4a3527' : config.shoes === 'trail_runners' ? '#2f5d7a' : '#9a7650';
  const sleeve = shorts ? config.skinTone : config.outfitColor;
  const ponchoColor = weather === 'rain' && config.outfit !== 'poncho' ? '#e0b23c' : config.outfitColor;
  const tunic = useTunic(w, config.outfit === 'dress_leggings' || config.outfit === 'jacket_pants');
  const poncho = usePoncho(w);
  const hipY = 0.86;
  const shoulderX = 0.21 * w;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const walking = animate && action === 'walk';
    const p = t * 5.2;
    const s = walking ? Math.sin(p) : 0;
    const set = (r: React.RefObject<THREE.Group | null>, x: number, z = 0) => {
      if (r.current) {
        r.current.rotation.x = x;
        r.current.rotation.z = z;
      }
    };
    if (action === 'rest') {
      set(thighL, -1.45, 0.12);
      set(thighR, -1.45, -0.12);
      set(kneeL, 1.5);
      set(kneeR, 1.5);
      set(armL, -0.35, 0.15);
      set(armR, -0.5, -0.15);
      set(elbowL, -0.9);
      set(elbowR, -1.0);
    } else if (action === 'celebrate') {
      const wave = animate ? Math.sin(t * 9) * 0.22 : 0;
      set(thighL, 0, 0.05);
      set(thighR, 0, -0.05);
      set(kneeL, 0);
      set(kneeR, 0);
      set(armL, 0, 2.7 + wave);
      set(armR, 0, -2.7 - wave);
      set(elbowL, -0.2);
      set(elbowR, -0.2);
    } else {
      set(thighL, s * 0.62);
      set(thighR, -s * 0.62);
      set(kneeL, walking ? Math.max(0, Math.sin(p - 1.3)) * 1.0 + 0.08 : 0.04);
      set(kneeR, walking ? Math.max(0, Math.sin(p + Math.PI - 1.3)) * 1.0 + 0.08 : 0.04);
      set(armL, -s * 0.5, 0.06);
      set(armR, s * 0.42 - (config.staff === 'wooden' ? 0.25 : 0.05), -0.06);
      set(elbowL, -0.25 - (walking ? Math.max(0, -s) * 0.4 : 0.05));
      set(elbowR, config.staff === 'wooden' ? -0.9 : -0.25 - (walking ? Math.max(0, s) * 0.4 : 0.05));
    }
    if (body.current) {
      const bob = !animate ? 0 : walking ? Math.abs(Math.cos(p)) * 0.045 : action === 'celebrate' ? Math.abs(Math.sin(t * 4.5)) * 0.28 : Math.sin(t * 1.6) * 0.006;
      body.current.position.y = (action === 'rest' ? -0.5 : 0) + bob;
    }
    if (torso.current) {
      torso.current.rotation.y = walking ? s * 0.09 : 0;
      torso.current.rotation.x = walking ? 0.07 : action === 'rest' ? 0.12 : 0;
      torso.current.scale.y = 1 + (animate && action === 'idle' ? Math.sin(t * 1.6) * 0.012 : 0);
    }
    if (head.current) {
      head.current.rotation.y = walking ? -s * 0.08 : animate && action === 'idle' ? Math.sin(t * 0.45) * 0.35 : 0;
      head.current.rotation.x = action === 'rest' ? 0.15 : walking ? -0.04 : 0;
    }
    if (shell.current && animate) shell.current.rotation.z = Math.sin(p) * 0.15;
  });

  const leg = (side: -1 | 1, thigh: React.RefObject<THREE.Group | null>, knee: React.RefObject<THREE.Group | null>) => (
    <group ref={thigh} position={[side * 0.095 * w, hipY, 0]}>
      <Part color={shorts ? lowerColor : lowerColor} outline={ol} position={[0, -0.19, 0]}>
        <capsuleGeometry args={[0.078 * w, 0.24, 4, 10]} />
      </Part>
      <group ref={knee} position={[0, -0.41, 0]}>
        <Part color={shorts ? config.skinTone : lowerColor} outline={ol} position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.064 * w, 0.24, 4, 10]} />
        </Part>
        {config.shoes === 'boots' && (
          <Part color={shoeColor} outline={ol} position={[0, -0.27, 0.005]}>
            <cylinderGeometry args={[0.078, 0.074, 0.14, 12]} />
          </Part>
        )}
        <Part color={shoeColor} outline={ol} position={[0, -0.39, 0.045]} scale={[1, 0.7, 1.55]}>
          <sphereGeometry args={[0.085, 14, 10]} />
        </Part>
        {config.shoes === 'sandals' && (
          <Part color={config.skinTone} outline={0} position={[0, -0.36, 0.06]} scale={[0.9, 0.5, 1.35]}>
            <sphereGeometry args={[0.075, 12, 8]} />
          </Part>
        )}
      </group>
    </group>
  );

  const arm = (side: -1 | 1, upper: React.RefObject<THREE.Group | null>, elbow: React.RefObject<THREE.Group | null>) => (
    <group ref={upper} position={[side * shoulderX, 0.38, 0]}>
      <Part color={sleeve} outline={ol} position={[0, -0.13, 0]}>
        <capsuleGeometry args={[0.058 * w, 0.17, 4, 10]} />
      </Part>
      <group ref={elbow} position={[0, -0.28, 0]}>
        <Part color={shorts ? config.skinTone : sleeve} outline={ol} position={[0, -0.11, 0]}>
          <capsuleGeometry args={[0.05 * w, 0.15, 4, 10]} />
        </Part>
        {!shorts && (
          <Part color={shade(sleeve, 0.8)} outline={0} position={[0, -0.21, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.04, 12]} />
          </Part>
        )}
        <Part color={config.skinTone} outline={ol} position={[0, -0.27, 0.01]} scale={[0.9, 1, 0.8]}>
          <sphereGeometry args={[0.062, 12, 10]} />
        </Part>
        {side === 1 && config.staff === 'wooden' && (
          <group position={[0.03, -0.27, 0.02]} rotation={[1.45, 0, -0.1]}>
            <Part color="#8a5a32" outline={ol} position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.022, 0.026, 1.75, 8]} />
            </Part>
            {/* cabaça amarrada ao bordão */}
            {config.accessories.includes('gourd') && (
              <group position={[0.05, 0.7, 0]}>
                <Part color="#d39443" outline={ol} position={[0, -0.05, 0]}>
                  <sphereGeometry args={[0.06, 12, 10]} />
                </Part>
                <Part color="#d39443" outline={ol} position={[0, 0.04, 0]}>
                  <sphereGeometry args={[0.04, 10, 8]} />
                </Part>
              </group>
            )}
          </group>
        )}
        {config.staff === 'poles' && (
          <group position={[0, -0.27, 0.02]} rotation={[1.3, 0, 0]}>
            <Part color="#3a3f47" outline={0} position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.013, 0.013, 1.2, 6]} />
            </Part>
            <Part color="#c0462e" outline={0} position={[0, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.12, 8]} />
            </Part>
          </group>
        )}
      </group>
    </group>
  );

  return (
    <group dispose={null}>
      <group ref={body}>
        {leg(-1, thighL, kneeL)}
        {leg(1, thighR, kneeR)}

        <group ref={torso} position={[0, hipY + 0.04, 0]}>
          {/* túnica/casaco */}
          <Part color={config.outfitColor} outline={ol} geometry={tunic} />
          {/* cinto */}
          <Part color="#5a3d26" outline={0} position={[0, 0.0, 0]} scale={[1, 1, 0.78]}>
            <cylinderGeometry args={[0.19 * w, 0.19 * w, 0.05, 20]} />
          </Part>
          <Part color="#d9b64a" outline={0} position={[0, 0.0, 0.15 * w]}>
            <boxGeometry args={[0.05, 0.04, 0.02]} />
          </Part>
          {/* gola/lenço */}
          <Part color={config.accessories.includes('bandana') ? '#c0462e' : shade(config.outfitColor, 0.75)} outline={ol} position={[0, 0.43, 0]} scale={[1, 0.6, 0.9]}>
            <torusGeometry args={[0.085, 0.035, 8, 16]} />
          </Part>

          {/* capa de chuva */}
          {rainGear && (
            <mesh geometry={poncho} castShadow material={toon(ponchoColor, { opacity: 0.96 })}>
              {outline && <Outlines thickness={ol} color={INK} />}
            </mesh>
          )}

          {/* mochila */}
          <group position={[0, 0.22, -(0.17 * w + pd / 2)]}>
            <RoundedBox args={[pw, ph, pd]} radius={0.05} smoothness={3} castShadow material={toon(config.backpackColor)}>
              {outline && <Outlines thickness={ol} color={INK} />}
            </RoundedBox>
            <RoundedBox args={[pw * 0.9, 0.1, pd * 1.05]} radius={0.03} position={[0, ph / 2 - 0.02, 0.01]} material={toon(shade(config.backpackColor, 0.78))} />
            <RoundedBox args={[pw * 0.6, ph * 0.32, 0.06]} radius={0.025} position={[0, -ph * 0.18, -pd / 2 - 0.02]} material={toon(shade(config.backpackColor, 0.85))} />
            {config.backpack !== 'small' && (
              <Part color="#7a8a5a" outline={ol} position={[0, -ph / 2 - 0.06, 0.02]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, pw + 0.06, 14]} />
              </Part>
            )}
            {config.backpack === 'large' && (
              <Part color="#d9a441" outline={ol} position={[0, ph / 2 + 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, pw + 0.1, 14]} />
              </Part>
            )}
            {config.accessories.includes('shell') && (
              <mesh ref={shell} position={[0, 0.06, -pd / 2 - 0.035]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.1, 0.3, 1.2]} material={toon('#fbf3e2')}>
                <sphereGeometry args={[0.085, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Outlines thickness={0.008} color="#a0703c" />
              </mesh>
            )}
            {Array.from({ length: Math.min(souvenirs, 8) }, (_, i) => (
              <mesh key={`pin-${i}`} position={[-pw / 2 + 0.07 + (i % 4) * ((pw - 0.14) / 3), ph / 2 - 0.13 - Math.floor(i / 4) * 0.11, -pd / 2 - 0.012]} rotation={[Math.PI / 2, 0, 0]} material={toon('#e7b93a', { emissive: '#4a3505' })}>
                <cylinderGeometry args={[0.032, 0.032, 0.014, 12]} />
              </mesh>
            ))}
            {config.accessories.includes('gourd') && config.staff !== 'wooden' && (
              <Part color="#d39443" outline={ol} position={[pw / 2 + 0.04, -0.1, 0]}>
                <sphereGeometry args={[0.06, 12, 10]} />
              </Part>
            )}
          </group>
          {/* alças */}
          {[-1, 1].map((sd) => (
            <Part key={sd} color={shade(config.backpackColor, 0.8)} outline={0} position={[sd * 0.11 * w, 0.25, 0.14 * w]} rotation={[0.15, 0, 0]}>
              <boxGeometry args={[0.045, 0.36, 0.025]} />
            </Part>
          ))}

          {arm(-1, armL, elbowL)}
          {arm(1, armR, elbowR)}

          {/* cabeça */}
          <group ref={head} position={[0, 0.62, 0.01]}>
            <Part color={config.skinTone} outline={ol} position={[0, -0.13, 0]}>
              <cylinderGeometry args={[0.05, 0.055, 0.1, 10]} />
            </Part>
            <Part color={config.skinTone} outline={ol} scale={[1, 1.07, 1]}>
              <sphereGeometry args={[0.15, 24, 18]} />
            </Part>
            {/* orelhas */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.148, -0.005, -0.005]} scale={[0.5, 0.85, 0.7]} material={toon(config.skinTone)}>
                <sphereGeometry args={[0.04, 10, 8]} />
              </mesh>
            ))}
            {/* olhos, sobrancelhas, nariz, bochechas */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 0.055, 0.0, 0.132]}>
                {config.accessories.includes('sunglasses') ? (
                  <mesh scale={[1.25, 0.8, 0.4]} material={toon('#1d2329')}>
                    <sphereGeometry args={[0.04, 12, 8]} />
                  </mesh>
                ) : (
                  <>
                    <mesh scale={[0.75, 1.1, 0.5]} material={toon('#2b2420')}>
                      <sphereGeometry args={[0.026, 12, 8]} />
                    </mesh>
                    <mesh position={[0.008, 0.01, 0.012]} material={toon('#ffffff', { emissive: '#ffffff' })}>
                      <sphereGeometry args={[0.007, 6, 6]} />
                    </mesh>
                  </>
                )}
                <mesh position={[0, 0.045, -0.004]} rotation={[0, 0, sd * -0.15]} material={toon(shade(config.hairColor, 0.9))}>
                  <boxGeometry args={[0.045, 0.011, 0.012]} />
                </mesh>
                <mesh position={[sd * 0.022, -0.05, -0.012]} scale={[1, 0.6, 0.3]} material={toon('#e88f7a', { opacity: 0.55 })}>
                  <sphereGeometry args={[0.022, 8, 6]} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, -0.035, 0.148]} scale={[0.8, 0.9, 0.9]} material={toon(shade(config.skinTone, 0.95))}>
              <sphereGeometry args={[0.02, 8, 6]} />
            </mesh>
            <mesh position={[0, -0.075, 0.138]} rotation={[0, 0, Math.PI]} material={toon('#7a3f33')}>
              <torusGeometry args={[0.018, 0.004, 4, 10, Math.PI]} />
            </mesh>

            {/* cabelo */}
            {config.hairStyle !== 'bald' && (
              <Part color={config.hairColor} outline={ol} position={[0, 0.03, -0.012]} rotation={[-0.35, 0, 0]}>
                <sphereGeometry args={[0.158, 24, 14, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
              </Part>
            )}
            {config.hairStyle !== 'bald' &&
              [-0.07, 0, 0.07].map((x, i) => (
                <mesh key={x} position={[x, 0.1, 0.1]} rotation={[0.9, 0, (i - 1) * 0.4]} scale={[1, 1, 0.6]} material={toon(config.hairColor)}>
                  <coneGeometry args={[0.05, 0.11, 8]} />
                </mesh>
              ))}
            {config.hairStyle === 'long' && (
              <Part color={config.hairColor} outline={ol} position={[0, -0.12, -0.08]} scale={[1, 1.3, 0.55]}>
                <sphereGeometry args={[0.14, 16, 12]} />
              </Part>
            )}
            {config.hairStyle === 'bun' && (
              <Part color={config.hairColor} outline={ol} position={[0, 0.1, -0.14]}>
                <sphereGeometry args={[0.065, 12, 10]} />
              </Part>
            )}
            {config.hairStyle === 'curly' &&
              [
                [-0.11, 0.08, -0.03],
                [0.11, 0.08, -0.03],
                [0, 0.14, -0.06],
                [-0.07, 0.12, 0.05],
                [0.07, 0.12, 0.05],
                [0, 0.06, -0.13],
              ].map((pp, i) => (
                <Part key={i} color={config.hairColor} outline={ol} position={pp as [number, number, number]}>
                  <sphereGeometry args={[0.065, 10, 8]} />
                </Part>
              ))}

            {/* chapéus */}
            {hat === 'sun_hat' && (
              <group position={[0, 0.1, -0.01]} rotation={[-0.12, 0, 0]}>
                <Part color="#c9a46a" outline={ol} scale={[1, 0.12, 1]}>
                  <cylinderGeometry args={[0.33, 0.33, 0.2, 28]} />
                </Part>
                <Part color="#c9a46a" outline={ol} position={[0, 0.07, 0]}>
                  <cylinderGeometry args={[0.13, 0.155, 0.13, 20]} />
                </Part>
                <mesh position={[0, 0.03, 0]} material={toon('#7a4b2a')}>
                  <cylinderGeometry args={[0.157, 0.157, 0.03, 20]} />
                </mesh>
                {config.accessories.includes('shell') && (
                  <mesh position={[0, 0.08, 0.14]} rotation={[0.2, 0, 0]} scale={[1, 1, 0.3]} material={toon('#fbf3e2')}>
                    <sphereGeometry args={[0.04, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  </mesh>
                )}
              </group>
            )}
            {hat === 'cap' && (
              <group position={[0, 0.06, 0]}>
                <Part color={shade(config.outfitColor, 0.9)} outline={ol}>
                  <sphereGeometry args={[0.162, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                </Part>
                <Part color={shade(config.outfitColor, 0.8)} outline={ol} position={[0, 0.005, 0.15]} rotation={[0.18, 0, 0]} scale={[1, 0.15, 1]}>
                  <cylinderGeometry args={[0.11, 0.11, 0.1, 16, 1, false, -Math.PI / 2, Math.PI]} />
                </Part>
              </group>
            )}
            {hat === 'beanie' && (
              <group position={[0, 0.05, 0]}>
                <Part color="#c0462e" outline={ol}>
                  <sphereGeometry args={[0.166, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.85]} />
                </Part>
                <Part color="#f3ead8" outline={ol} position={[0, 0.17, 0]}>
                  <sphereGeometry args={[0.045, 10, 8]} />
                </Part>
              </group>
            )}
            {rainGear && hat === 'none' && (
              <Part color={ponchoColor} outline={ol} position={[0, 0.03, -0.025]} rotation={[-0.25, 0, 0]}>
                <sphereGeometry args={[0.178, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
              </Part>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}
