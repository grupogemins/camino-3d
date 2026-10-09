'use client';
import { ArrowRight, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChipGroup, Field, RangeField, SelectField } from '@/components/ui/Controls';
import { Notice } from '@/components/ui/States';
import { destinations, origins } from '@/data/demo/routes';
import { addDays } from '@/lib/format';
import { ROUTE_MODES } from '@/lib/planner/planner';
import { suggestedMode } from '@/lib/planner/defaults';
import type { RouteMode } from '@/lib/domain/types';
import { useAppStore } from '@/store/useAppStore';

export default function PlanejarPage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const trip = useAppStore((s) => s.trip);
  const [originId, setOrigin] = useState(profile?.originId ?? 'porto');
  const [destinationId, setDestination] = useState(profile?.destinationId ?? 'santiago');
  const [start, setStart] = useState(profile?.startDate ?? addDays(new Date().toISOString(), 30));
  const [days, setDays] = useState(profile?.daysAvailable ?? 12);
  const [km, setKm] = useState(profile?.dailyKm ?? 20);
  const [mode, setMode] = useState<RouteMode>(suggestedMode(profile));

  function compare() {
    const q = new URLSearchParams({ origin: originId, dest: destinationId, start, days: String(days), km: String(km), mode });
    router.push(`/rotas?${q}`);
  }

  return (
    <>
      <TopBar title="Planejar viagem" back="/inicio" />
      {trip && <Notice tone="info" icon={<Info aria-hidden size={18} />}>Você já tem uma viagem planejada. Criar outra substitui a atual{' '}(o plano gratuito permite uma viagem ativa).</Notice>}
      <Card className="mt-3 flex flex-col gap-5">
        <SelectField label="Origem" value={originId} onChange={(e) => setOrigin(e.target.value)}>
          {origins.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Destino" value={destinationId} onChange={(e) => setDestination(e.target.value)}>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <Field label="Data de início" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <RangeField label="Dias de caminhada" value={days} min={3} max={30} unit="dias" onChange={setDays} />
        <RangeField label="Distância por dia" value={km} min={8} max={35} unit="km" onChange={setKm} />
        <ChipGroup label="Prioridade da rota" single value={[mode]} onChange={(v) => setMode(v[0])} options={ROUTE_MODES.map((m) => ({ id: m.id, label: m.label }))} />
        <p className="-mt-3 text-sm text-muted">{ROUTE_MODES.find((m) => m.id === mode)?.description}</p>
        <Button size="lg" block onClick={compare} icon={<ArrowRight aria-hidden />}>
          Ver e comparar rotas
        </Button>
      </Card>
    </>
  );
}
