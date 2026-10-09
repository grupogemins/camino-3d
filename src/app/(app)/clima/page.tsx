'use client';
import { AlertTriangle, Droplets, Sunrise, Sunset, Thermometer, Wind, Sun } from 'lucide-react';
import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { PremiumHint } from '@/components/places/PremiumGate';
import { Card, SectionTitle, Stat } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/Controls';
import { DemoBadge, SourceLine } from '@/components/ui/DataSource';
import { ErrorState, LoadingState, Notice, OfflineState } from '@/components/ui/States';
import { ADVICE_ICON, weatherUrl } from '@/components/weather/WeatherMini';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { getStop } from '@/data/demo/stops';
import { useApi } from '@/hooks/useApi';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import type { WeatherSnapshot } from '@/lib/domain/types';
import { WEATHER_LABEL } from '@/lib/labels';
import { weatherAdvice } from '@/lib/weatherAdvice';

function StageWeatherRow({ stopId, label }: { stopId: string; label: string }) {
  const stop = getStop(stopId)!;
  const res = useApi<WeatherSnapshot>(weatherUrl(stop.coord, stop.name));
  return (
    <li className="flex items-center gap-3 rounded-xl bg-surface p-2">
      <span className="w-16 shrink-0 text-sm font-bold">{label}</span>
      <span className="min-w-0 flex-1 truncate">{stop.name}</span>
      {res.data ? (
        <span className="flex items-center gap-2 text-sm">
          <WeatherIcon condition={res.data.daily[0].condition} size={20} />
          {res.data.daily[0].minC}°/{res.data.daily[0].maxC}°
          <span className="inline-flex items-center gap-0.5 text-blue"><Droplets aria-hidden size={13} />{res.data.daily[0].precipProb}%</span>
        </span>
      ) : (
        <span className="text-sm text-muted">{res.status === 'loading' ? '…' : 'indisponível'}</span>
      )}
    </li>
  );
}

export default function ClimaPage() {
  const { trip, currentSegment, stopIds } = useTripContext();
  const { can } = usePlan();
  const [stopId, setStopId] = useState(currentSegment?.toStopId ?? stopIds[0]);
  const stop = getStop(stopId)!;
  const res = useApi<WeatherSnapshot>(weatherUrl(stop.coord, stop.name));
  const w = res.data;

  return (
    <>
      <TopBar title="Clima" back="/explorar" actions={w?.isDemo ? <DemoBadge compact /> : undefined} />
      <SelectField label="Local" value={stopId} onChange={(e) => setStopId(e.target.value)}>
        {stopIds.map((id) => (
          <option key={id} value={id}>{getStop(id)?.name}</option>
        ))}
      </SelectField>
      <div className="mt-3 flex flex-col gap-3">
        {res.status === 'loading' && <LoadingState rows={2} />}
        {res.status === 'error' && <ErrorState description={res.error} onRetry={res.reload} />}
        {res.status === 'offline' && <OfflineState description={w ? 'Sem conexão: mostrando a última previsão salva.' : 'Sem conexão e sem previsão salva para este local.'} />}
        {w && (
          <>
            {w.alerts.map((a) => (
              <Notice key={a.id} tone="danger" icon={<AlertTriangle aria-hidden size={18} />}>
                <b>{a.title}</b> · {a.description} <span className="block text-xs">Emitido por: {a.issuer}</span>
              </Notice>
            ))}
            <Card>
              <div className="flex items-center gap-4">
                <WeatherIcon condition={w.current.condition} size={56} />
                <div>
                  <p className="text-4xl font-extrabold">{w.current.tempC}°C</p>
                  <p>{WEATHER_LABEL[w.current.condition]} · sensação {w.current.feelsLikeC}°C</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat label="Chuva" value={<span className="inline-flex items-center gap-1"><Droplets aria-hidden size={16} />{w.current.precipProb}%</span>} />
                <Stat label="Vento" value={<span className="inline-flex items-center gap-1"><Wind aria-hidden size={16} />{w.current.windKmh} km/h</span>} />
                <Stat label="Índice UV" value={<span className="inline-flex items-center gap-1"><Sun aria-hidden size={16} />{w.current.uvIndex}</span>} />
                <Stat label="Nascer do sol" value={<span className="inline-flex items-center gap-1"><Sunrise aria-hidden size={16} />{w.sunrise}</span>} />
                <Stat label="Pôr do sol" value={<span className="inline-flex items-center gap-1"><Sunset aria-hidden size={16} />{w.sunset}</span>} />
                <Stat label="Sensação" value={<span className="inline-flex items-center gap-1"><Thermometer aria-hidden size={16} />{w.current.feelsLikeC}°</span>} />
              </div>
              <SourceLine className="mt-3" source={w.source} fetchedAt={w.fetchedAt} isDemo={w.isDemo} />
            </Card>

            <SectionTitle>Recomendações</SectionTitle>
            <ul className="flex flex-col gap-2">
              {weatherAdvice(w).map((a) => {
                const Icon = ADVICE_ICON[a.icon];
                return (
                  <li key={a.id} className="flex items-start gap-3 rounded-2xl bg-surface p-3">
                    <Icon aria-hidden className="mt-0.5 shrink-0 text-primary" />
                    {a.text}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted">A previsão pode mudar. Consulte também os alertas oficiais (IPMA em Portugal, AEMET na Espanha).</p>

            <SectionTitle>Próximas horas</SectionTitle>
            <div className="-mx-4 overflow-x-auto px-4" tabIndex={0} role="region" aria-label="Previsão por hora (role para os lados)">
              <ol className="flex gap-2 pb-2">
                {w.hourly.slice(0, 12).map((h) => (
                  <li key={h.time} className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl bg-surface p-2 text-sm">
                    <span className="text-muted">{new Date(h.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}</span>
                    <WeatherIcon condition={h.condition} size={22} />
                    <b>{h.tempC}°</b>
                    <span className="text-xs text-blue">{h.precipProb}%</span>
                  </li>
                ))}
              </ol>
            </div>

            <SectionTitle>Próximos dias</SectionTitle>
            <ul className="flex flex-col gap-1.5">
              {w.daily.map((d) => (
                <li key={d.date} className="flex items-center gap-3 rounded-xl bg-surface p-2 text-sm">
                  <span className="w-24 font-semibold">{new Date(`${d.date}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                  <WeatherIcon condition={d.condition} size={20} />
                  <span className="flex-1">{WEATHER_LABEL[d.condition]}</span>
                  <span>{d.minC}° / <b>{d.maxC}°</b></span>
                  <span className="w-12 text-right text-blue">{d.precipProb}%</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <SectionTitle>Clima ao longo da viagem</SectionTitle>
        <p className="mb-2 text-sm text-muted">Mostra a previsão atual de cada destino. Para dias distantes, confira de novo na véspera.</p>
        {trip && can('stage_weather') ? (
          <ul className="flex flex-col gap-1.5">
            {trip.segments.map((s) => (
              <StageWeatherRow key={s.id} stopId={s.toStopId} label={`Dia ${s.day}`} />
            ))}
          </ul>
        ) : trip ? (
          <PremiumHint>Previsão para cada etapa da viagem está no Premium.</PremiumHint>
        ) : (
          <p className="text-sm text-muted">Planeje uma viagem para ver o clima por etapa.</p>
        )}
      </div>
    </>
  );
}
