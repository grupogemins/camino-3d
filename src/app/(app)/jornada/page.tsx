'use client';
import { Film, Gift, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ExploreViewer } from '@/components/avatar/Lazy3D';
import { TopBar } from '@/components/layout/TopBar';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Controls';
import { DemoBadge } from '@/components/ui/DataSource';
import { EmptyState } from '@/components/ui/States';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { weatherUrl } from '@/components/weather/WeatherMini';
import { demoPilgrims } from '@/data/demo/pilgrims';
import { getStop } from '@/data/demo/stops';
import { useApi } from '@/hooks/useApi';
import { useTripContext } from '@/hooks/useTripContext';
import { timeZoneFor } from '@/lib/copilot/copilot';
import type { WeatherSnapshot } from '@/lib/domain/types';
import { formatKm } from '@/lib/format';
import { currentRegion, hourIn, journeyStats, reachedCities, souvenirFor, timeOfDayFor, worldWeather } from '@/lib/journey';
import { useAppStore } from '@/store/useAppStore';

const TIME_LABEL = { dawn: 'Amanhecer', day: 'Dia', dusk: 'Entardecer', night: 'Noite' } as const;
const WEATHER_LABEL = { clear: 'Tempo bom', rain: 'Chuva', cold: 'Frio', hot: 'Calor' } as const;

/**
 * Mundo 3D da jornada: o peregrino avança conforme as etapas reais concluídas,
 * com região, hora local e clima do lugar onde a pessoa está.
 */
export default function JornadaPage() {
  const { trip, route, currentSegment } = useTripContext();
  const avatar = useAppStore((s) => s.avatar);
  const privacy = useAppStore((s) => s.privacy);
  const [showOthers, setShowOthers] = useState(true);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const cities = trip ? reachedCities(trip) : [];
  const here = cities.length ? getStop(cities[cities.length - 1].stopId) : getStop(currentSegment?.fromStopId ?? 'porto');
  const weather = useApi<WeatherSnapshot>(here ? weatherUrl(here.coord, here.name) : null);
  const region = trip ? currentRegion(route, trip) : 'porto';
  // Pré-visualização (?hora=dusk&tempo=clear) para demonstrações; sem parâmetros, usa hora e clima reais.
  const [preview, setPreview] = useState<{ hora?: keyof typeof TIME_LABEL; tempo?: keyof typeof WEATHER_LABEL }>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const hora = q.get('hora');
    const tempo = q.get('tempo');
    setPreview({ hora: hora && hora in TIME_LABEL ? (hora as keyof typeof TIME_LABEL) : undefined, tempo: tempo && tempo in WEATHER_LABEL ? (tempo as keyof typeof WEATHER_LABEL) : undefined });
  }, []);
  const tod = preview.hora ?? timeOfDayFor(hourIn(timeZoneFor(region), now));
  const mood = preview.tempo ?? worldWeather(weather.data);

  // Peregrinos fictícios que aceitaram aparecer (disponíveis e com localização não oculta) na mesma parada.
  const companions = useMemo(
    () => (showOthers ? demoPilgrims.filter((p) => p.availableToChat && p.location && !!here && here.name.startsWith(p.location.cityName)).map((p) => p.avatar) : []),
    [showOthers, here],
  );

  if (!trip) {
    return (
      <>
        <TopBar title="Minha jornada 3D" back="/inicio" />
        <EmptyState title="Planeje sua viagem" description="Seu peregrino avança no mundo 3D conforme você conclui as etapas reais." action={<ButtonLink href="/planejar">Planejar</ButtonLink>} />
      </>
    );
  }

  const stats = journeyStats(trip);
  const arrived = trip.status === 'completed';
  const lastCity = cities[cities.length - 1];

  return (
    <>
      <TopBar title="Minha jornada 3D" subtitle={here ? `Em ${here.name}` : route.name} back="/inicio" actions={<DemoBadge compact />} />
      <div className="relative h-[460px] overflow-hidden rounded-2xl border border-line">
        <ExploreViewer config={avatar} region={region} weather={mood} timeOfDay={tod} action={arrived ? 'celebrate' : lastCity ? 'rest' : 'idle'} progress={arrived || lastCity ? 1 : 0} companions={companions} souvenirs={cities.length} />
        {lastCity && (
          <div className="pointer-events-none absolute inset-x-3 top-3 rounded-2xl bg-surface/90 p-3 text-center shadow">
            <p className="text-sm text-muted">{arrived ? 'Chegada' : `Dia ${lastCity.day} concluído`}</p>
            <p className="text-lg font-extrabold">{arrived ? 'Bem-vindo a Santiago de Compostela!' : `Bem-vindo a ${lastCity.name}`}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        {TIME_LABEL[tod]} em {here?.name} · {WEATHER_LABEL[mood]}{weather.data?.isDemo ? ' (clima de demonstração)' : ''}. Cena estilizada inspirada na região; não é navegação.
      </p>

      <Card className="mt-3">
        <ProgressBar value={stats.progress} label={`${formatKm(stats.walkedKm)} de ${formatKm(stats.totalKm)}`} />
        <p className="mt-2 text-sm text-muted">{stats.stagesDone} de {stats.stagesTotal} etapas · seu peregrino ganha um broche dourado a cada cidade.</p>
        <div className="mt-2 border-t border-line pt-2">
          <Switch
            checked={showOthers && privacy.communityPresence}
            onChange={setShowOthers}
            disabled={!privacy.communityPresence}
            label="Mostrar outros peregrinos"
            description={privacy.communityPresence ? 'Só quem aceitou aparecer, na mesma parada, sem posição real.' : 'Ative sua presença na Comunidade para ver e ser visto.'}
          />
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {lastCity ? (
          <ButtonLink href={`/cartao/${lastCity.segmentId}`} icon={<Sparkles aria-hidden />}>Cartão do dia</ButtonLink>
        ) : (
          <ButtonLink href="/mapa?navegar=1" icon={<Sparkles aria-hidden />}>Começar etapa</ButtonLink>
        )}
        <ButtonLink href="/retrospectiva" variant="outline" icon={<Film aria-hidden />}>Retrospectiva</ButtonLink>
      </div>

      <SectionTitle>Lembranças das cidades</SectionTitle>
      {cities.length === 0 ? (
        <p className="text-muted">Primeira lembrança ao chegar em {currentSegment?.toName}: {currentSegment ? souvenirFor(currentSegment.toStopId, currentSegment.toName) : ''}.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cities.map((c) => (
            <li key={c.segmentId} className="flex items-start gap-2 rounded-2xl bg-gold-soft p-3">
              <Gift aria-hidden className="mt-0.5 shrink-0 text-warning" size={18} />
              <span>
                <span className="block text-sm font-bold">{c.souvenir}</span>
                <span className="text-xs text-muted">{c.name} · dia {c.day}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
