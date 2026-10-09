import type { AvatarConfiguration } from '@/lib/domain/types';

export type AvatarPose = 'walk' | 'rest' | 'celebrate' | 'idle';

const BODY_W: Record<AvatarConfiguration['bodyType'], number> = { slim: 22, average: 26, broad: 31 };
const PACK: Record<AvatarConfiguration['backpack'], [number, number]> = { small: [24, 26], medium: [30, 32], large: [36, 40] };

/**
 * Peregrino em SVG (fallback sem WebGL e miniaturas). Mesma configuração do modelo 3D.
 * Estilizado e original: sem traços de rosto, para não remeter a pessoas reais.
 */
export function Avatar2D({ config, size = 120, pose = 'idle', label }: { config: AvatarConfiguration; size?: number; pose?: AvatarPose; label?: string }) {
  const w = BODY_W[config.bodyType];
  const [pw, ph] = PACK[config.backpack];
  const cx = 60;
  const armUp = pose === 'celebrate';
  const sitting = pose === 'rest';
  const legSwing = pose === 'walk' ? 6 : 0;
  const lower = config.outfit === 'tshirt_shorts' ? 'shorts' : config.outfit === 'dress_leggings' ? 'dress' : 'pants';
  const outfitColor = config.outfit === 'poncho' ? config.outfitColor : config.outfitColor;
  const pantsColor = lower === 'shorts' ? '#6b5a44' : lower === 'dress' ? '#2a2a2a' : '#5a4a36';
  const shoeColor = config.shoes === 'boots' ? '#3a2d22' : config.shoes === 'trail_runners' ? '#2f5d7a' : '#8a6a4a';
  const bodyTop = sitting ? 54 : 44;
  const description = label ?? `Peregrino ${pose === 'walk' ? 'caminhando' : pose === 'rest' ? 'descansando' : pose === 'celebrate' ? 'comemorando' : 'parado'}, com mochila e ${config.staff === 'none' ? 'sem bastão' : 'bastão'}.`;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={description}>
      <ellipse cx={cx} cy={112} rx={30} ry={5} fill="rgb(0 0 0 / 0.12)" />
      {/* mochila (atrás) */}
      <rect x={cx - pw / 2} y={bodyTop - 6} width={pw} height={ph} rx={8} fill={config.backpackColor} />
      {config.backpack === 'large' && <rect x={cx - pw / 2 - 2} y={bodyTop - 10} width={pw + 4} height={7} rx={3.5} fill="#d1a43a" />}
      {/* pernas */}
      {sitting ? (
        <>
          <rect x={cx - 16} y={84} width={16} height={9} rx={4} fill={pantsColor} />
          <rect x={cx} y={84} width={16} height={9} rx={4} fill={pantsColor} />
          <rect x={cx - 20} y={90} width={10} height={6} rx={3} fill={shoeColor} />
          <rect x={cx + 12} y={90} width={10} height={6} rx={3} fill={shoeColor} />
        </>
      ) : (
        <>
          <rect x={cx - 11} y={82} width={9} height={24} rx={4} fill={lower === 'shorts' ? config.skinTone : pantsColor} transform={`rotate(${legSwing} ${cx - 6} 82)`} />
          <rect x={cx + 2} y={82} width={9} height={24} rx={4} fill={lower === 'shorts' ? config.skinTone : pantsColor} transform={`rotate(${-legSwing} ${cx + 6} 82)`} />
          {lower === 'shorts' && (
            <>
              <rect x={cx - 12} y={80} width={11} height={11} rx={3} fill={pantsColor} />
              <rect x={cx + 1} y={80} width={11} height={11} rx={3} fill={pantsColor} />
            </>
          )}
          <rect x={cx - 13} y={103} width={12} height={6} rx={3} fill={shoeColor} transform={`rotate(${legSwing} ${cx - 6} 82)`} />
          <rect x={cx + 1} y={103} width={12} height={6} rx={3} fill={shoeColor} transform={`rotate(${-legSwing} ${cx + 6} 82)`} />
        </>
      )}
      {/* tronco */}
      {config.outfit === 'poncho' ? (
        <path d={`M${cx - w / 2 - 6} ${bodyTop + 38} L${cx} ${bodyTop - 2} L${cx + w / 2 + 6} ${bodyTop + 38} Z`} fill={outfitColor} />
      ) : (
        <rect x={cx - w / 2} y={bodyTop} width={w} height={lower === 'dress' ? 44 : 40} rx={9} fill={outfitColor} />
      )}
      {/* alças */}
      <line x1={cx - w / 4} y1={bodyTop + 2} x2={cx - w / 4} y2={bodyTop + 26} stroke={config.backpackColor} strokeWidth={3} />
      <line x1={cx + w / 4} y1={bodyTop + 2} x2={cx + w / 4} y2={bodyTop + 26} stroke={config.backpackColor} strokeWidth={3} />
      {config.accessories.includes('shell') && <path d={`M${cx + w / 4} ${bodyTop + 20} c -5 -3 -5 -8 0 -9 c 5 1 5 6 0 9 z`} fill="#f4efe4" stroke="#d4a017" strokeWidth={1} />}
      {config.accessories.includes('bandana') && <path d={`M${cx - 8} ${bodyTop + 1} L${cx + 8} ${bodyTop + 1} L${cx} ${bodyTop + 9} Z`} fill="#b5452f" />}
      {/* braços */}
      <rect x={cx - w / 2 - 7} y={armUp ? bodyTop - 22 : bodyTop + 2} width={8} height={26} rx={4} fill={outfitColor} />
      <rect x={cx + w / 2 - 1} y={armUp ? bodyTop - 22 : bodyTop + 2} width={8} height={26} rx={4} fill={outfitColor} />
      <circle cx={cx - w / 2 - 3} cy={armUp ? bodyTop - 22 : bodyTop + 29} r={4} fill={config.skinTone} />
      <circle cx={cx + w / 2 + 3} cy={armUp ? bodyTop - 22 : bodyTop + 29} r={4} fill={config.skinTone} />
      {/* bastão(ões) */}
      {config.staff === 'wooden' && !armUp && <line x1={cx + w / 2 + 6} y1={bodyTop + 14} x2={cx + w / 2 + 10} y2={110} stroke="#7a5230" strokeWidth={3.5} strokeLinecap="round" />}
      {config.staff === 'poles' && !armUp && (
        <>
          <line x1={cx + w / 2 + 4} y1={bodyTop + 26} x2={cx + w / 2 + 12} y2={110} stroke="#30343a" strokeWidth={2} />
          <line x1={cx - w / 2 - 4} y1={bodyTop + 26} x2={cx - w / 2 - 12} y2={110} stroke="#30343a" strokeWidth={2} />
        </>
      )}
      {/* cabeça e cabelo */}
      {config.hairStyle === 'long' && <rect x={cx - 11} y={bodyTop - 22} width={22} height={26} rx={9} fill={config.hairColor} />}
      <circle cx={cx} cy={bodyTop - 12} r={11} fill={config.skinTone} />
      {config.hairStyle === 'short' && <path d={`M${cx - 11} ${bodyTop - 13} a11 11 0 0 1 22 0 c -4 -4 -18 -4 -22 0z`} fill={config.hairColor} />}
      {config.hairStyle === 'curly' && [-8, -3, 3, 8].map((dx) => <circle key={dx} cx={cx + dx} cy={bodyTop - 21} r={5} fill={config.hairColor} />)}
      {config.hairStyle === 'bun' && (
        <>
          <path d={`M${cx - 11} ${bodyTop - 13} a11 11 0 0 1 22 0 c -4 -4 -18 -4 -22 0z`} fill={config.hairColor} />
          <circle cx={cx} cy={bodyTop - 26} r={5} fill={config.hairColor} />
        </>
      )}
      {config.hairStyle === 'long' && <path d={`M${cx - 11} ${bodyTop - 13} a11 11 0 0 1 22 0 c -4 -4 -18 -4 -22 0z`} fill={config.hairColor} />}
      {config.accessories.includes('sunglasses') && <rect x={cx - 8} y={bodyTop - 15} width={16} height={4} rx={2} fill="#1d1d1d" />}
      {/* chapéu */}
      {config.hat === 'sun_hat' && (
        <>
          <ellipse cx={cx} cy={bodyTop - 19} rx={18} ry={4} fill="#a08a66" />
          <rect x={cx - 9} y={bodyTop - 29} width={18} height={11} rx={5} fill="#a08a66" />
        </>
      )}
      {config.hat === 'cap' && <path d={`M${cx - 11} ${bodyTop - 17} a11 10 0 0 1 22 0 l 7 2 l -29 0 z`} fill={config.outfitColor} />}
      {config.hat === 'beanie' && <path d={`M${cx - 12} ${bodyTop - 15} a12 12 0 0 1 24 0 z`} fill="#b5452f" />}
      {pose === 'celebrate' && (
        <g fill="#d4a017">
          <circle cx={22} cy={20} r={3} />
          <circle cx={98} cy={16} r={3} />
          <circle cx={30} cy={40} r={2} />
          <circle cx={92} cy={38} r={2} />
        </g>
      )}
    </svg>
  );
}
