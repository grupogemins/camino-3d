'use client';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExploreViewer } from '@/components/avatar/Lazy3D';
import { weatherUrl } from '@/components/weather/WeatherMini';
import { getStop } from '@/data/demo/stops';
import { useApi } from '@/hooks/useApi';
import { useTripContext } from '@/hooks/useTripContext';
import { timeZoneFor } from '@/lib/copilot/copilot';
import type { WeatherSnapshot } from '@/lib/domain/types';
import { formatDate, formatKm } from '@/lib/format';
import { currentRegion, hourIn, timeOfDayFor, worldWeather } from '@/lib/journey';
import { useAppStore } from '@/store/useAppStore';

/** Abertura do Início: o mundo 3D da jornada como janela viva, com o progresso por cima. */
export function JourneyHero() {
  const avatar = useAppStore((s) => s.avatar);
  const { trip, route, currentSegment } = useTripContext();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const here = currentSegment ? getStop(currentSegment.fromStopId) : undefined;
  const weather = useApi<WeatherSnapshot>(here ? weatherUrl(here.coord, here.name) : null);
  if (!trip) return null;

  const walked = trip.segments.filter((s) => trip.completedSegmentIds.includes(s.id)).reduce((a, s) => a + s.distanceKm, 0);
  const total = trip.segments.reduce((a, s) => a + s.distanceKm, 0);
  const pct = total ? walked / total : 0;
  const region = currentRegion(route, trip);
  const tod = timeOfDayFor(hourIn(timeZoneFor(region), now));
  const done = trip.completedSegmentIds.length;
  const day = currentSegment?.day ?? trip.segments.length;

  return (
    <section aria-label="Minha jornada" className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-[2rem]">
      <div className="h-[360px] w-full">
        <ExploreViewer config={avatar} region={region} weather={worldWeather(weather.data)} timeOfDay={tod} action={trip.status === 'completed' ? 'celebrate' : 'walk'} progress={done ? pct : undefined} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
      <div className="absolute left-4 top-3 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
        <CalendarDays aria-hidden size={13} /> Dia {day} de {trip.segments.length}
      </div>
      <div className="absolute inset-x-4 bottom-4 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/80">{route.name}</p>
        <p className="font-display text-[1.9rem] leading-[1.05] drop-shadow-sm">
          {currentSegment ? (
            <>
              {currentSegment.fromName} <span className="text-[var(--gold)]">→</span> {currentSegment.toName}
            </>
          ) : (
            'Santiago de Compostela'
          )}
        </p>
        <div className="mt-3">
          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold text-white/85">
              <span>
                {formatKm(walked)} de {formatKm(total)}
              </span>
              <span>Início {formatDate(trip.startDate)}</span>
            </div>
            <div role="progressbar" aria-label="Progresso da jornada" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${Math.max(2, pct * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
      <Link href="/jornada" className="absolute right-3 top-3 inline-flex min-h-10 items-center gap-1 rounded-full bg-white/95 px-3.5 text-sm font-bold text-ink shadow-lg">
        Ver minha jornada 3D <ArrowUpRight aria-hidden size={16} />
      </Link>
    </section>
  );
}
