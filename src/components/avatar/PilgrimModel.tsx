'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import type { AvatarConfiguration } from '@/lib/domain/types';

export type PilgrimAction = 'idle' | 'walk' | 'rest' | 'celebrate';
export type WeatherMood = 'clear' | 'rain' | 'cold' | 'hot';

const WIDTH: Record<AvatarConfiguration['bodyType'], number> = { slim: 0.3, average: 0.36, broad: 0.44 };
const PACK: Record<AvatarConfiguration['backpack'], [number, number, number]> = {
  small: [0.3, 0.34, 0.16],
  medium: [0.36, 0.46, 0.2],
  large: [0.42, 0.6, 0.26],
};

function Std({ color, rough = 0.85 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} />;
}

/**
 * Peregrino 3D estilizado feito com primitivas (sem assets externos, leve para celulares modestos).
 * Animações procedurais: caminhar, descansar, comemorar; reage ao clima (capa de chuva, gorro).
 */
export function PilgrimModel({ config, action = 'idle', weather = 'clear', animate = true, souvenirs = 0 }: { config: AvatarConfiguration; action?: PilgrimAction; weather?: WeatherMood; animate?: boolean; /** Lembranças de cidades alcançadas: broches dourados na mochila. */ souvenirs?: number }) {
  const root = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const body = useRef<Group>(null);
  const shellRef = useRef<Mesh>(null);

  const w = WIDTH[config.bodyType];
  const [pw, ph, pd] = PACK[config.backpack];
  const rainGear = weather === 'rain' || config.outfit === 'poncho';
  const hat = weather === 'cold' ? 'beanie' : weather === 'hot' && config.hat === 'none' ? 'sun_hat' : config.hat;
  const lowerColor = config.outfit === 'tshirt_shorts' ? '#6b5a44' : config.outfit === 'dress_leggings' ? '#2a2a2a' : '#5a4a36';
  const shoeColor = config.shoes === 'boots' ? '#3a2d22' : config.shoes === 'trail_runners' ? '#2f5d7a' : '#8a6a4a';
  const legSkin = config.outfit === 'tshirt_shorts';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const swing = animate && action === 'walk' ? Math.sin(t * 5) * 0.55 : 0;
    if (legL.current && legR.current) {
      const sit = action === 'rest' ? -1.45 : 0;
      legL.current.rotation.x = sit + swing;
      legR.current.rotation.x = sit - swing;
    }
    if (armL.current && armR.current) {
      if (action === 'celebrate') {
        const wave = animate ? Math.sin(t * 8) * 0.25 : 0;
        armL.current.rotation.z = 2.6 + wave;
        armR.current.rotation.z = -2.6 - wave;
        armL.current.rotation.x = armR.current.rotation.x = 0;
      } else {
        armL.current.rotation.z = 0.08;
        armR.current.rotation.z = -0.08;
        armL.current.rotation.x = -swing * 0.8;
        armR.current.rotation.x = action === 'rest' ? -0.5 : swing * 0.8 - 0.15;
      }
    }
    if (body.current) {
      const bounce = animate ? (action === 'walk' ? Math.abs(Math.sin(t * 5)) * 0.04 : action === 'celebrate' ? Math.abs(Math.sin(t * 4)) * 0.25 : Math.sin(t * 1.5) * 0.008) : 0;
      body.current.position.y = (action === 'rest' ? -0.42 : 0) + bounce;
    }
    if (shellRef.current && animate) shellRef.current.rotation.z = Math.sin(t * 5) * 0.12;
  });

  return (
    <group ref={root} dispose={null}>
      <group ref={body}>
        {/* Pernas (pivô no quadril) */}
        {[
          [legL, -w * 0.27],
          [legR, w * 0.27],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as React.RefObject<Group>} position={[x as number, 0.9, 0]}>
            <mesh position={[0, -0.4, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.62, 4, 10]} />
              <Std color={legSkin ? config.skinTone : lowerColor} />
            </mesh>
            {config.outfit === 'tshirt_shorts' && (
              <mesh position={[0, -0.12, 0]} castShadow>
                <cylinderGeometry args={[0.095, 0.09, 0.26, 10]} />
                <Std color={lowerColor} />
              </mesh>
            )}
            <mesh position={[0, -0.84, 0.05]} castShadow>
              <boxGeometry args={[0.13, config.shoes === 'boots' ? 0.12 : 0.08, 0.26]} />
              <Std color={shoeColor} />
            </mesh>
          </group>
        ))}

        {/* Tronco */}
        <mesh position={[0, 1.18, 0]} castShadow>
          <capsuleGeometry args={[w * 0.5, 0.36, 4, 12]} />
          <Std color={config.outfitColor} />
        </mesh>
        {config.outfit === 'dress_leggings' && (
          <mesh position={[0, 0.88, 0]} castShadow>
            <coneGeometry args={[w * 0.75, 0.42, 14, 1, true]} />
            <Std color={config.outfitColor} />
          </mesh>
        )}
        {rainGear && (
          <mesh position={[0, 1.05, 0]} castShadow>
            <coneGeometry args={[w * 1.25, 0.95, 16]} />
            <meshStandardMaterial color={weather === 'rain' && config.outfit !== 'poncho' ? '#d1a43a' : config.outfitColor} roughness={0.4} transparent opacity={0.92} />
          </mesh>
        )}

        {/* Mochila */}
        <group position={[0, 1.2, -(w * 0.5 + pd / 2)]}>
          <mesh castShadow>
            <boxGeometry args={[pw, ph, pd]} />
            <Std color={config.backpackColor} />
          </mesh>
          {config.backpack === 'large' && (
            <mesh position={[0, ph / 2 + 0.06, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, pw + 0.12, 12]} />
              <Std color="#d1a43a" />
            </mesh>
          )}
          {config.accessories.includes('shell') && (
            <mesh ref={shellRef} position={[0, 0.02, -pd / 2 - 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.25, 1.1]}>
              <sphereGeometry args={[0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <Std color="#f4efe4" rough={0.5} />
            </mesh>
          )}
          {/* Broches das cidades alcançadas (evolução ao longo da jornada) */}
          {Array.from({ length: Math.min(souvenirs, 8) }, (_, i) => (
            <mesh key={`pin-${i}`} position={[(-pw / 2 + 0.08) + (i % 4) * ((pw - 0.16) / 3), ph / 2 - 0.1 - Math.floor(i / 4) * 0.12, pd / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.015, 10]} />
              <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
          {config.accessories.includes('gourd') && (
            <mesh position={[pw / 2 + 0.03, -0.1, 0]}>
              <sphereGeometry args={[0.06, 10, 8]} />
              <Std color="#c98a3a" />
            </mesh>
          )}
        </group>
        {/* Alças */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * w * 0.28, 1.25, w * 0.42]} castShadow>
            <boxGeometry args={[0.05, 0.4, 0.03]} />
            <Std color={config.backpackColor} />
          </mesh>
        ))}

        {/* Braços (pivô no ombro) */}
        {[
          [armL, -1],
          [armR, 1],
        ].map(([ref, s]) => (
          <group key={s as number} ref={ref as React.RefObject<Group>} position={[(s as number) * (w * 0.5 + 0.06), 1.42, 0]}>
            <mesh position={[0, -0.26, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.4, 4, 8]} />
              <Std color={config.outfit === 'tshirt_shorts' ? config.skinTone : config.outfitColor} />
            </mesh>
            <mesh position={[0, -0.52, 0]}>
              <sphereGeometry args={[0.055, 10, 8]} />
              <Std color={config.skinTone} />
            </mesh>
            {(s as number) === 1 && config.staff === 'wooden' && (
              <mesh position={[0, -0.45, 0.04]} rotation={[0.12, 0, 0]} castShadow>
                <cylinderGeometry args={[0.022, 0.025, 1.6, 8]} />
                <Std color="#7a5230" />
              </mesh>
            )}
            {config.staff === 'poles' && (
              <mesh position={[0, -0.75, 0.08]} rotation={[0.2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, 1.15, 6]} />
                <Std color="#30343a" rough={0.4} />
              </mesh>
            )}
          </group>
        ))}

        {/* Cabeça */}
        <group position={[0, 1.66, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.135, 18, 14]} />
            <Std color={config.skinTone} rough={0.7} />
          </mesh>
          {config.hairStyle !== 'bald' && (
            <mesh position={[0, 0.02, -0.01]} castShadow>
              <sphereGeometry args={[0.142, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
              <Std color={config.hairColor} />
            </mesh>
          )}
          {config.hairStyle === 'long' && (
            <mesh position={[0, -0.12, -0.07]} castShadow>
              <boxGeometry args={[0.26, 0.3, 0.1]} />
              <Std color={config.hairColor} />
            </mesh>
          )}
          {config.hairStyle === 'bun' && (
            <mesh position={[0, 0.1, -0.12]}>
              <sphereGeometry args={[0.06, 10, 8]} />
              <Std color={config.hairColor} />
            </mesh>
          )}
          {config.hairStyle === 'curly' &&
            [-0.09, 0, 0.09].map((x) => (
              <mesh key={x} position={[x, 0.1, -0.03]}>
                <sphereGeometry args={[0.065, 10, 8]} />
                <Std color={config.hairColor} />
              </mesh>
            ))}
          {config.accessories.includes('sunglasses') && (
            <mesh position={[0, 0.02, 0.12]}>
              <boxGeometry args={[0.2, 0.045, 0.03]} />
              <Std color="#1d1d1d" rough={0.2} />
            </mesh>
          )}
          {config.accessories.includes('bandana') && (
            <mesh position={[0, -0.16, 0.02]}>
              <torusGeometry args={[0.1, 0.025, 6, 14]} />
              <Std color="#b5452f" />
            </mesh>
          )}
          {hat === 'sun_hat' && (
            <group position={[0, 0.1, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.28, 0.28, 0.02, 24]} />
                <Std color="#a08a66" />
              </mesh>
              <mesh position={[0, 0.07, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.14, 0.13, 16]} />
                <Std color="#a08a66" />
              </mesh>
            </group>
          )}
          {hat === 'cap' && (
            <group position={[0, 0.06, 0]}>
              <mesh>
                <sphereGeometry args={[0.148, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Std color={config.outfitColor} />
              </mesh>
              <mesh position={[0, 0, 0.16]} rotation={[0.1, 0, 0]}>
                <boxGeometry args={[0.2, 0.015, 0.14]} />
                <Std color={config.outfitColor} />
              </mesh>
            </group>
          )}
          {hat === 'beanie' && (
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.152, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
              <Std color="#b5452f" />
            </mesh>
          )}
          {rainGear && hat === 'none' && (
            <mesh position={[0, 0.03, -0.02]}>
              <sphereGeometry args={[0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
              <meshStandardMaterial color="#d1a43a" roughness={0.4} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}
