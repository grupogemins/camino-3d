'use client';
import { BedDouble, CalendarDays, CloudSun, Compass, Languages, Navigation, NotebookPen, ShieldCheck, Sparkles, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { Avatar2D } from '@/components/avatar/Avatar2D';
import { TopBar } from '@/components/layout/TopBar';
import { RouteAlerts } from '@/components/trip/RouteAlerts';
import { StageSummary } from '@/components/trip/StageSummary';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { WeatherMini } from '@/components/weather/WeatherMini';
import { getStop } from '@/data/demo/stops';
import { useTripContext } from '@/hooks/useTripContext';
import { addDays, formatDate, formatKm } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

const SHORTCUTS = [
  { href: '/hospedagens', label: 'Dormir', icon: BedDouble },
  { href: '/comer', label: 'Comer', icon: UtensilsCrossed },
  { href: '/clima', label: 'Clima', icon: CloudSun },
  { href: '/tradutor', label: 'Tradutor', icon: Languages },
  { href: '/cultura', label: 'Cultura', icon: Compass },
  { href: '/diario', label: 'Diário', icon: NotebookPen },
];

export default function HomePage() {
  const profile = useAppStore((s) => s.profile);
  const avatar = useAppStore((s) => s.avatar);
  const { trip, route, currentSegment } = useTripContext();

  const walked = trip ? trip.segments.filter((s) => trip.completedSegmentIds.includes(s.id)).reduce((a, s) => a + s.distanceKm, 0) : 0;
  const total = trip ? trip.segments.reduce((a, s) => a + s.distanceKm, 0) : 0;
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
          <Card className="flex items-center gap-4">
            <Link href="/peregrino" aria-label="Personalizar meu peregrino" className="shrink-0 rounded-2xl bg-surface-2">
              <Avatar2D config={avatar} size={88} pose={trip.status === 'completed' ? 'celebrate' : 'walk'} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-sm text-muted">
                <CalendarDays aria-hidden size={14} /> Início em {formatDate(trip.startDate)} · {trip.segments.length} etapas
              </p>
              <ProgressBar value={total ? walked / total : 0} label={`${formatKm(walked)} de ${formatKm(total)}`} />
            </div>
          </Card>

          {currentSegment && (
            <section aria-labelledby="hoje">
              <SectionTitle id="hoje">Etapa de hoje</SectionTitle>
              <StageSummary segment={currentSegment} date={formatDate(addDays(trip.startDate, currentSegment.day - 1))} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <ButtonLink href="/mapa?navegar=1" size="lg" icon={<Navigation aria-hidden />}>
                  Navegar
                </ButtonLink>
                <ButtonLink href={`/etapas/${currentSegment.id}`} variant="outline" size="lg">
                  Detalhes
                </ButtonLink>
              </div>
            </section>
          )}

          {dest && <WeatherMini coord={dest.coord} name={dest.name} />}

          <nav aria-label="Atalhos">
            <ul className="grid grid-cols-3 gap-3">
              {SHORTCUTS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-surface font-semibold hover:border-primary">
                    <Icon aria-hidden className="text-primary" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="/seguranca" className="flex items-center gap-3 rounded-2xl bg-danger-soft p-4 font-bold text-danger">
            <ShieldCheck aria-hidden /> Central de Segurança: SOS, 112 e check-in
          </Link>

          <section aria-labelledby="alertas">
            <SectionTitle id="alertas">Avisos da rota</SectionTitle>
            <RouteAlerts alerts={route.alerts.filter((a) => a.severity !== 'info')} />
          </section>

          <section aria-labelledby="etapas">
            <SectionTitle id="etapas" action={<Link className="text-sm font-bold text-primary" href="/planejar">Replanejar</Link>}>
              Todas as etapas
            </SectionTitle>
            <ul className="flex flex-col gap-2">
              {trip.segments.map((s) => (
                <li key={s.id}>
                  <StageSummary segment={s} done={trip.completedSegmentIds.includes(s.id)} date={formatDate(addDays(trip.startDate, s.day - 1))} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
