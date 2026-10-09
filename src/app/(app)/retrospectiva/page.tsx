'use client';
import { Award, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CardStudio } from '@/components/cards/CardStudio';
import { TopBar } from '@/components/layout/TopBar';
import { SchematicMap } from '@/components/map/SchematicMap';
import { PremiumHint } from '@/components/places/PremiumGate';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle, Stat } from '@/components/ui/Card';
import { EmptyState, Notice } from '@/components/ui/States';
import { ACHIEVEMENTS } from '@/data/demo/achievements';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import { drawRetroCard, loadImage } from '@/lib/cards/render';
import type { LngLat } from '@/lib/domain/types';
import { addDays, formatDate, formatKm } from '@/lib/format';
import { haversineKm } from '@/lib/geo/geo';
import { journeyStats, reachedCities } from '@/lib/journey';
import { useAppStore } from '@/store/useAppStore';

export default function RetrospectivaPage() {
  const { trip, route } = useTripContext();
  const avatar = useAppStore((s) => s.avatar);
  const journal = useAppStore((s) => s.journal);
  const unlocked = useAppStore((s) => s.achievementsUnlocked);
  const name = useAppStore((s) => s.profile?.displayName ?? 'peregrino');
  const { can } = usePlan();
  const photoSrcs = useMemo(() => journal.flatMap((j) => j.photos).slice(0, 4), [journal]);
  const [photos, setPhotos] = useState<HTMLImageElement[] | null>(photoSrcs.length ? null : []);
  useEffect(() => {
    Promise.all(photoSrcs.map((p) => loadImage(p).catch(() => null))).then((l) => setPhotos(l.filter(Boolean) as HTMLImageElement[]));
  }, [photoSrcs]);

  if (!trip) {
    return (
      <>
        <TopBar title="Retrospectiva" back="/eu" />
        <EmptyState title="Ainda não há jornada" description="Planeje e comece sua viagem. A retrospectiva vai se formando a cada etapa." action={<ButtonLink href="/planejar">Planejar</ButtonLink>} />
      </>
    );
  }

  const stats = journeyStats(trip);
  const cities = reachedCities(trip);
  const arrived = trip.status === 'completed';
  const origin = route.stops.find((s) => s.id === trip.segments[0]?.fromStopId);
  const last = cities.length ? route.stops.find((s) => s.id === cities[cities.length - 1].stopId) : origin;
  const nearest = (c: LngLat | undefined) => (c ? route.geometry.reduce((best, p, i) => (haversineKm(p, c) < haversineKm(route.geometry[best], c) ? i : best), 0) : 0);
  const startIdx = nearest(origin?.coord);
  const line = route.geometry.slice(startIdx);
  const reachedIndex = Math.max(1, nearest(last?.coord) - startIdx);
  const lastDay = cities.length ? cities[cities.length - 1].day : 1;
  const achievements = ACHIEVEMENTS.filter((a) => unlocked[a.code]);

  return (
    <>
      <TopBar title="Retrospectiva" subtitle={arrived ? 'Você chegou a Santiago!' : 'Sua jornada até agora'} back="/eu" />
      {arrived && <Notice tone="success">Parabéns! Sua peregrinação está completa. Ela fica guardada aqui para sempre.</Notice>}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Caminhados" value={formatKm(stats.walkedKm)} />
        <Stat label="Etapas" value={`${stats.stagesDone}/${stats.stagesTotal}`} />
        <Stat label="Subida acumulada" value={`${stats.ascentM.toLocaleString('pt-BR')} m`} />
        <Stat label="Lembranças" value={cities.length} />
      </div>

      <div className="mt-3">
        <SchematicMap
          height={300}
          data={{
            routeLine: line,
            activeLine: line.slice(0, reachedIndex + 1),
            markers: cities.map((c) => {
              const s = route.stops.find((x) => x.id === c.stopId)!;
              return { id: c.stopId, coord: s.coord, kind: 'stop' as const, label: `${c.name}: ${c.souvenir}`, color: '#d4a017', glyph: String(c.day) };
            }),
            focus: line,
          }}
        />
      </div>

      <SectionTitle>Linha do tempo</SectionTitle>
      {cities.length === 0 ? (
        <p className="text-muted">Conclua a primeira etapa para começar sua linha do tempo.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {cities.map((c) => {
            const notes = journal.filter((j) => j.segmentId === c.segmentId);
            return (
              <li key={c.segmentId}>
                <Card className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft font-extrabold text-warning">{c.day}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 font-bold"><MapPin aria-hidden size={16} /> {c.name}</p>
                    <p className="text-sm text-muted">{formatDate(addDays(trip.startDate, c.day - 1))} · Lembrança: {c.souvenir}</p>
                    {notes.map((n) => <p key={n.id} className="mt-1 text-sm">“{n.title}”</p>)}
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      {achievements.length > 0 && (
        <>
          <SectionTitle>Conquistas</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {achievements.map((a) => <li key={a.id} className="flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold"><Award aria-hidden size={14} /> {a.title}</li>)}
          </ul>
        </>
      )}

      <SectionTitle>Compartilhar</SectionTitle>
      {can('retrospective') ? (
        photos && (
          <CardStudio
            avatar={avatar}
            pose={arrived ? 'celebrate' : 'walk'}
            filename="camino-retrospectiva"
            title={`Retrospectiva do Caminho de ${name}`}
            deps={[photos, trip.updatedAt, avatar]}
            draw={(ctx, avatarImg, t) =>
              drawRetroCard(
                ctx,
                {
                  name,
                  routeName: route.shortName,
                  startDate: formatDate(trip.startDate),
                  endDate: formatDate(addDays(trip.startDate, lastDay - 1)),
                  walkedKm: stats.walkedKm,
                  ascentM: stats.ascentM,
                  days: lastDay,
                  cities: cities.map((c) => c.name),
                  souvenirs: cities.length,
                  line,
                  reachedIndex,
                  photos,
                  avatar: avatarImg,
                  watermark: false,
                },
                t,
              )
            }
          />
        )
      ) : (
        <PremiumHint>A retrospectiva em imagem e vídeo faz parte do Camino Pass. Os cartões de cada etapa são grátis.</PremiumHint>
      )}
    </>
  );
}
