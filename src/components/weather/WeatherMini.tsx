'use client';
import { Droplets, Sunrise, Umbrella, Wind, Sun, Thermometer, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { DemoBadge } from '@/components/ui/DataSource';
import { ErrorState, LoadingState, OfflineState } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import type { LngLat, WeatherSnapshot } from '@/lib/domain/types';
import { WEATHER_LABEL } from '@/lib/labels';
import { weatherAdvice, type Advice } from '@/lib/weatherAdvice';
import { WeatherIcon } from './WeatherIcon';

export const ADVICE_ICON: Record<Advice['icon'], typeof Sun> = { droplet: Droplets, sun: Sun, umbrella: Umbrella, wind: Wind, thermometer: Thermometer, alert: AlertTriangle, sunrise: Sunrise };

export function weatherUrl(coord: LngLat, name: string) {
  return `/api/weather?lat=${coord[1]}&lng=${coord[0]}&name=${encodeURIComponent(name)}`;
}

export function WeatherMini({ coord, name }: { coord: LngLat; name: string }) {
  const res = useApi<WeatherSnapshot>(weatherUrl(coord, name));
  if (res.status === 'loading') return <LoadingState rows={1} label="Carregando clima" />;
  if (res.status === 'error') return <ErrorState description={res.error} onRetry={res.reload} />;
  if (!res.data) return <OfflineState description="Sem conexão e sem previsão salva para este local." />;
  const w = res.data;
  const advice = weatherAdvice(w).slice(0, 2);
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted">Clima em {w.locationName}</p>
          <p className="flex items-center gap-2 text-3xl font-extrabold">
            <WeatherIcon condition={w.current.condition} size={32} />
            {w.current.tempC}°C
          </p>
          <p className="text-sm">
            {WEATHER_LABEL[w.current.condition]} · sensação {w.current.feelsLikeC}°C · chuva {w.current.precipProb}%
          </p>
        </div>
        {w.isDemo && <DemoBadge compact />}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {advice.map((a) => {
          const Icon = ADVICE_ICON[a.icon];
          return (
            <li key={a.id} className="flex items-start gap-2 text-sm">
              <Icon aria-hidden size={16} className="mt-0.5 shrink-0 text-primary" />
              {a.text}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted">A previsão pode mudar.</p>
        <Link href="/clima" className="text-sm font-bold text-primary underline-offset-2 hover:underline">
          Ver previsão completa
        </Link>
      </div>
      {res.status === 'offline' && <p className="mt-1 text-xs font-semibold text-warning">Mostrando a última previsão salva.</p>}
    </Card>
  );
}
