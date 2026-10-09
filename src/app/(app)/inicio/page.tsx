'use client';
import { ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { TopBar } from '@/components/layout/TopBar';
import { RouteAlerts } from '@/components/trip/RouteAlerts';
import { JourneyHero } from '@/components/home/JourneyHero';
import { ShortcutTiles } from '@/components/home/ShortcutTiles';
import { TodayStage } from '@/components/trip/TodayStage';
import { TrailTimeline } from '@/components/trip/TrailTimeline';
import { ButtonLink } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { WeatherMini } from '@/components/weather/WeatherMini';
import { getStop } from '@/data/demo/stops';
import { useTripContext } from '@/hooks/useTripContext';
import { addDays, formatDate } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export default function HomePage() {
  const profile = useAppStore((s) => s.profile);
  const { trip, route, currentSegment } = useTripContext();

  const dest = currentSegment ? getStop(currentSegment.toStopId) : undefined;

  return (
    <>
      <TopBar title={`Olá, ${profile?.displayName ?? 'peregrino'}`} subtitle={trip ? route.name : 'Vamos planejar seu Caminho'} />
      {!trip ? (
        <EmptyState
          icon={<Sparkles aria-hidden className="text-gold" size={32} />}
          title="Você ainda não tem uma viagem"
          description="Escolha a origem, os dias e o seu ritmo. Sugerimos as etapas até Santiago."
          action={<ButtonLink href="/planejar">Planejar minha viagem</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <JourneyHero />

          {currentSegment && (
            <section aria-labelledby="hoje">
              <SectionTitle id="hoje">Etapa de hoje</SectionTitle>
              <TodayStage segment={currentSegment} date={formatDate(addDays(trip.startDate, currentSegment.day - 1))} />
            </section>
          )}

          <CopilotPanel />

          {dest && <WeatherMini coord={dest.coord} name={dest.name} />}

          <ShortcutTiles />

          <Link href="/seguranca" className="flex items-center gap-3 rounded-[var(--radius-card)] border border-danger/20 bg-danger-soft p-4 font-bold text-danger">
            <ShieldCheck aria-hidden /> <span className="flex-1">Central de Segurança: SOS, 112 e check-in</span> <ChevronRight aria-hidden size={18} />
          </Link>

          <section aria-labelledby="alertas">
            <SectionTitle id="alertas">Avisos da rota</SectionTitle>
            <RouteAlerts alerts={route.alerts.filter((a) => a.severity !== 'info')} />
          </section>

          <section aria-labelledby="etapas">
            <SectionTitle id="etapas" action={<Link className="text-sm font-bold text-primary" href="/planejar">Replanejar</Link>}>
              Etapas do Caminho
            </SectionTitle>
            <TrailTimeline segments={trip.segments} doneIds={trip.completedSegmentIds} currentId={currentSegment?.id} dateFor={(s) => formatDate(addDays(trip.startDate, s.day - 1))} />
          </section>
        </div>
      )}
    </>
  );
}
