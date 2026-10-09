'use client';
import { Crown, RotateCcw } from 'lucide-react';
import { AvatarViewer } from '@/components/avatar/Lazy3D';
import type { PilgrimAction, WeatherMood } from '@/components/avatar/PilgrimModel';
import { TopBar } from '@/components/layout/TopBar';
import { PremiumHint } from '@/components/places/PremiumGate';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ChipGroup, Segmented } from '@/components/ui/Controls';
import { CLOTH_COLORS, DEFAULT_AVATAR, HAIR_COLORS, SKIN_TONES } from '@/data/demo/avatarDefaults';
import { usePlan } from '@/hooks/usePlan';
import type { AvatarConfiguration } from '@/lib/domain/types';
import { useAppStore } from '@/store/useAppStore';
import { useState } from 'react';

function Swatches({ label, colors, value, onChange, locked }: { label: string; colors: string[]; value: string; onChange: (c: string) => void; locked?: number }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => {
          const isLocked = locked !== undefined && i >= locked;
          return (
            <button
              key={c}
              type="button"
              onClick={() => !isLocked && onChange(c)}
              aria-pressed={value === c}
              aria-label={`${label}: cor ${i + 1}${isLocked ? ' (Camino Pass)' : ''}`}
              disabled={isLocked}
              className={`relative h-11 w-11 rounded-full border-4 ${value === c ? 'border-primary' : 'border-surface'} shadow disabled:opacity-40`}
              style={{ backgroundColor: c }}
            >
              {isLocked && <Crown aria-hidden size={14} className="absolute -right-1 -top-1 text-gold" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function PeregrinoPage() {
  const avatar = useAppStore((s) => s.avatar);
  const setAvatar = useAppStore((s) => s.setAvatar);
  const { can } = usePlan();
  const extended = can('avatar_extended');
  const [action, setAction] = useState<PilgrimAction>('idle');
  const [weather, setWeather] = useState<WeatherMood>('clear');
  const set = (p: Partial<AvatarConfiguration>) => setAvatar(p);
  const freeColors = extended ? undefined : 4;

  return (
    <>
      <TopBar title="Meu peregrino" back="/eu" />
      <div className="h-80 overflow-hidden rounded-2xl border border-line sm:h-96">
        <AvatarViewer config={avatar} action={action} weather={weather} />
      </div>
      <p className="mt-1 text-xs text-muted">Arraste para girar. Personagem original e estilizado.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Segmented label="Animação" value={action} onChange={setAction} options={[{ id: 'idle', label: 'Parado' }, { id: 'walk', label: 'Caminhar' }, { id: 'rest', label: 'Descansar' }, { id: 'celebrate', label: 'Comemorar' }]} />
        <Segmented label="Clima" value={weather} onChange={setWeather} options={[{ id: 'clear', label: 'Sol' }, { id: 'rain', label: 'Chuva' }, { id: 'cold', label: 'Frio' }, { id: 'hot', label: 'Calor' }]} />
      </div>

      <SectionTitle>Corpo</SectionTitle>
      <Card className="flex flex-col gap-4">
        <ChipGroup label="Tipo corporal" single value={[avatar.bodyType]} onChange={(v) => set({ bodyType: v[0] })} options={[{ id: 'slim', label: 'Esguio' }, { id: 'average', label: 'Médio' }, { id: 'broad', label: 'Largo' }]} />
        <ChipGroup label="Apresentação" single value={[avatar.presentation]} onChange={(v) => set({ presentation: v[0] })} options={[{ id: 'feminine', label: 'Feminina' }, { id: 'masculine', label: 'Masculina' }, { id: 'neutral', label: 'Neutra' }]} />
        <p className="-mt-2 text-sm text-muted">Todas as roupas e acessórios ficam disponíveis para qualquer apresentação.</p>
        <Swatches label="Tom de pele" colors={SKIN_TONES} value={avatar.skinTone} onChange={(skinTone) => set({ skinTone })} />
        <ChipGroup label="Cabelo" single value={[avatar.hairStyle]} onChange={(v) => set({ hairStyle: v[0] })} options={[{ id: 'short', label: 'Curto' }, { id: 'long', label: 'Longo' }, { id: 'bun', label: 'Coque' }, { id: 'curly', label: 'Cacheado' }, { id: 'bald', label: 'Sem cabelo' }]} />
        <Swatches label="Cor do cabelo" colors={HAIR_COLORS} value={avatar.hairColor} onChange={(hairColor) => set({ hairColor })} locked={freeColors} />
      </Card>

      <SectionTitle>Equipamento</SectionTitle>
      <Card className="flex flex-col gap-4">
        <ChipGroup label="Roupa" single value={[avatar.outfit]} onChange={(v) => set({ outfit: v[0] })} options={[{ id: 'tshirt_shorts', label: 'Camiseta e bermuda' }, { id: 'jacket_pants', label: 'Jaqueta e calça' }, { id: 'dress_leggings', label: 'Vestido e legging' }, { id: 'poncho', label: 'Capa de chuva' }]} />
        <Swatches label="Cor da roupa" colors={CLOTH_COLORS} value={avatar.outfitColor} onChange={(outfitColor) => set({ outfitColor })} locked={freeColors} />
        <ChipGroup label="Mochila" single value={[avatar.backpack]} onChange={(v) => set({ backpack: v[0] })} options={[{ id: 'small', label: 'Pequena' }, { id: 'medium', label: 'Média' }, { id: 'large', label: 'Grande' }]} />
        <Swatches label="Cor da mochila" colors={CLOTH_COLORS} value={avatar.backpackColor} onChange={(backpackColor) => set({ backpackColor })} locked={freeColors} />
        <ChipGroup label="Chapéu" single value={[avatar.hat]} onChange={(v) => set({ hat: v[0] })} options={[{ id: 'none', label: 'Nenhum' }, { id: 'sun_hat', label: 'Chapéu de aba' }, { id: 'cap', label: 'Boné' }, { id: 'beanie', label: 'Gorro' }]} />
        <ChipGroup label="Calçados" single value={[avatar.shoes]} onChange={(v) => set({ shoes: v[0] })} options={[{ id: 'boots', label: 'Botas' }, { id: 'trail_runners', label: 'Tênis de trilha' }, { id: 'sandals', label: 'Sandálias' }]} />
        <ChipGroup label="Bastão" single value={[avatar.staff]} onChange={(v) => set({ staff: v[0] })} options={[{ id: 'none', label: 'Nenhum' }, { id: 'wooden', label: 'Cajado de madeira' }, { id: 'poles', label: 'Bastões de trekking' }]} />
        <ChipGroup
          label="Acessórios"
          value={avatar.accessories}
          onChange={(v) => set({ accessories: extended ? v : v.filter((a) => a === 'shell' || a === 'bandana') })}
          options={[{ id: 'shell', label: 'Vieira' }, { id: 'bandana', label: 'Bandana' }, { id: 'gourd', label: `Cabaça${extended ? '' : ' (Camino Pass)'}` }, { id: 'sunglasses', label: `Óculos de sol${extended ? '' : ' (Camino Pass)'}` }]}
        />
        {!extended && <PremiumHint>Cores extras e acessórios especiais fazem parte da personalização ampliada (Camino Pass).</PremiumHint>}
      </Card>
      <Button className="mt-4" variant="outline" block onClick={() => setAvatar(DEFAULT_AVATAR)} icon={<RotateCcw aria-hidden />}>Restaurar padrão</Button>
    </>
  );
}
