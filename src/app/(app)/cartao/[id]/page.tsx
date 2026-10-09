'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CardStudio } from '@/components/cards/CardStudio';
import { TopBar } from '@/components/layout/TopBar';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { ACHIEVEMENTS } from '@/data/demo/achievements';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import { drawStageCard, loadImage } from '@/lib/cards/render';
import { addDays, formatDate } from '@/lib/format';
import { souvenirFor } from '@/lib/journey';
import { useAppStore } from '@/store/useAppStore';

export default function StageCardPage() {
  const { id } = useParams<{ id: string }>();
  const { trip, route } = useTripContext();
  const avatar = useAppStore((s) => s.avatar);
  const journal = useAppStore((s) => s.journal);
  const unlocked = useAppStore((s) => s.achievementsUnlocked);
  const { can } = usePlan();
  const seg = trip?.segments.find((s) => s.id === id);
  const photo = journal.find((j) => j.segmentId === id && j.photos.length)?.photos[0];
  const [img, setImg] = useState<HTMLImageElement | null | undefined>(photo ? undefined : null);
  useEffect(() => {
    if (photo) loadImage(photo).then(setImg, () => setImg(null));
  }, [photo]);

  if (!trip || !seg || !trip.completedSegmentIds.includes(seg.id)) {
    return (
      <>
        <TopBar title="Cartão da etapa" back="/inicio" />
        <EmptyState title="Conclua a etapa primeiro" description="O cartão é criado quando você marca a etapa como concluída." action={<ButtonLink href={seg ? `/etapas/${seg.id}` : '/inicio'}>Ver etapa</ButtonLink>} />
      </>
    );
  }

  const next = trip.segments.find((s) => s.day === seg.day + 1);
  const doneAt = trip.completedAt?.[seg.id];
  const achievements = doneAt
    ? ACHIEVEMENTS.filter((a) => unlocked[a.code] && Math.abs(new Date(unlocked[a.code]).getTime() - new Date(doneAt).getTime()) < 120_000).map((a) => a.title)
    : [];
  const region = route.stops.find((s) => s.id === seg.toStopId)?.region ?? 'minho';

  return (
    <>
      <TopBar title="Cartão da etapa" subtitle={`Dia ${seg.day}: ${seg.fromName} → ${seg.toName}`} back={`/etapas/${seg.id}`} />
      {img === undefined ? null : <CardStudio
        avatar={avatar}
        pose={next ? 'walk' : 'celebrate'}
        filename={`camino-dia-${seg.day}`}
        title={`Cartão do dia ${seg.day}: ${seg.fromName} até ${seg.toName}`}
        deps={[seg.id, img, avatar]}
        draw={(ctx, avatarImg, t) => {
          drawStageCard(
            ctx,
            {
              routeName: route.shortName,
              day: seg.day,
              from: seg.fromName,
              to: seg.toName,
              date: formatDate(addDays(trip.startDate, seg.day - 1)),
              distanceKm: seg.distanceKm,
              ascentM: seg.ascentM,
              hours: seg.estimatedHours,
              souvenir: souvenirFor(seg.toStopId, seg.toName),
              achievements,
              next: next ? `${next.fromName} → ${next.toName} · ${Math.round(next.distanceKm)} km` : undefined,
              photo: img,
              avatar: avatarImg,
              region,
              watermark: !can('retrospective'),
            },
            t,
          );
        }}
      />}
      {!photo && <p className="mt-3 text-sm text-muted">Dica: adicione uma foto a esta etapa no Diário e ela aparece no cartão.</p>}
    </>
  );
}
