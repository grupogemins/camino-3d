'use client';
import { BedDouble, Bus, CheckCircle2, Circle, Clock, Mountain, MountainSnow, Navigation, Route as RouteIcon, UtensilsCrossed } from 'lucide-react';
import { useParams } from 'next/navigation';
import { WaypointIcon } from '@/components/common/WaypointIcon';
import { TopBar } from '@/components/layout/TopBar';
import { ElevationProfile } from '@/components/trip/ElevationProfile';
import { RouteAlerts } from '@/components/trip/RouteAlerts';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';
import { Card, SectionTitle, Stat } from '@/components/ui/Card';
import { DemoBadge } from '@/components/ui/DataSource';
import { EmptyState } from '@/components/ui/States';
import { WeatherMini } from '@/components/weather/WeatherMini';
import { getStop } from '@/data/demo/stops';
import { useTripContext } from '@/hooks/useTripContext';
import { addDays, formatDate, formatHours, formatKm } from '@/lib/format';
import { DIFFICULTY_LABEL, TERRAIN_LABEL, WAYPOINT_LABEL } from '@/lib/labels';
import { useAppStore } from '@/store/useAppStore';

export default function StageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { trip, route } = useTripContext();
  const toggleDone = useAppStore((s) => s.toggleSegmentDone);
  const segment = trip?.segments.find((s) => s.id === id);

  if (!trip || !segment) {
    return (
      <>
        <TopBar title="Etapa" back="/inicio" />
        <EmptyState title="Etapa não encontrada" description="Planeje uma viagem para ver os detalhes das etapas." action={<ButtonLink href="/planejar">Planejar</ButtonLink>} />
      </>
    );
  }

  const done = trip.completedSegmentIds.includes(segment.id);
  const dest = getStop(segment.toStopId)!;
  const alerts = route.alerts.filter((a) => a.km !== undefined && a.km > segment.startKm && a.km <= segment.endKm);
  const transport = segment.waypoints.filter((w) => w.kind === 'transport');
  const services = segment.waypoints.filter((w) => w.kind !== 'transport');

  return (
    <>
      <TopBar title={`Dia ${segment.day}: ${segment.toName}`} subtitle={`${segment.fromName} → ${segment.toName} · ${formatDate(addDays(trip.startDate, segment.day - 1))}`} back="/inicio" />
      <div className="flex flex-wrap gap-2">
        <Badge tone={segment.difficulty === 'hard' ? 'terracotta' : segment.difficulty === 'moderate' ? 'gold' : 'green'}>{DIFFICULTY_LABEL[segment.difficulty]}</Badge>
        {segment.terrain.map((t) => (
          <Badge key={t}>{TERRAIN_LABEL[t]}</Badge>
        ))}
        <DemoBadge compact />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Distância" value={<span className="inline-flex items-center gap-1"><RouteIcon aria-hidden size={18} />{formatKm(segment.distanceKm)}</span>} />
        <Stat label="Tempo estimado" value={<span className="inline-flex items-center gap-1"><Clock aria-hidden size={18} />{formatHours(segment.estimatedHours)}</span>} hint="sem pausas" />
        <Stat label="Subida" value={<span className="inline-flex items-center gap-1"><Mountain aria-hidden size={18} />{segment.ascentM} m</span>} hint="estimativa" />
        <Stat label="Descida" value={<span className="inline-flex items-center gap-1"><MountainSnow aria-hidden size={18} />{segment.descentM} m</span>} hint="estimativa" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ButtonLink href={`/mapa?navegar=1&etapa=${segment.id}`} size="lg" icon={<Navigation aria-hidden />}>
          Navegar
        </ButtonLink>
        <Button variant={done ? 'secondary' : 'outline'} size="lg" onClick={() => toggleDone(segment.id)} icon={done ? <CheckCircle2 aria-hidden /> : <Circle aria-hidden />} aria-pressed={done}>
          {done ? 'Concluída' : 'Marcar concluída'}
        </Button>
      </div>
      {done && (
        <ButtonLink href={`/cartao/${segment.id}`} variant="secondary" block className="mt-3" icon={<Sparkles aria-hidden />}>
          Criar cartão da etapa
        </ButtonLink>
      )}

      <Card className="mt-4">
        <ElevationProfile route={route} startKm={segment.startKm} endKm={segment.endKm} />
      </Card>

      {alerts.length > 0 && (
        <section aria-labelledby="alertas-etapa">
          <SectionTitle id="alertas-etapa">Atenção nesta etapa</SectionTitle>
          <RouteAlerts alerts={alerts} />
        </section>
      )}

      <section aria-labelledby="servicos">
        <SectionTitle id="servicos">No caminho</SectionTitle>
        {services.length ? (
          <ul className="flex flex-col gap-2">
            {services.map((w) => (
              <li key={w.id} className="flex items-start gap-3 rounded-2xl bg-surface p-3">
                <WaypointIcon kind={w.kind} size={22} />
                <div className="flex-1">
                  <p className="font-semibold">
                    {w.name} <span className="text-sm font-normal text-muted">· km {w.km} · {WAYPOINT_LABEL[w.kind]}</span>
                  </p>
                  {w.note && <p className="text-sm text-muted">{w.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Sem pontos cadastrados" description="Os dados de serviços desta etapa ainda não estão disponíveis." />
        )}
      </section>

      <section aria-labelledby="chegada">
        <SectionTitle id="chegada">Chegada em {dest.name}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <ButtonLink href={`/hospedagens?parada=${dest.id}`} variant="outline" icon={<BedDouble aria-hidden />}>
            Onde dormir
          </ButtonLink>
          <ButtonLink href={`/comer?parada=${dest.id}`} variant="outline" icon={<UtensilsCrossed aria-hidden />}>
            Onde comer
          </ButtonLink>
        </div>
        <div className="mt-3">
          <WeatherMini coord={dest.coord} name={dest.name} />
        </div>
      </section>

      <section aria-labelledby="desistencia">
        <SectionTitle id="desistencia">Se precisar parar</SectionTitle>
        <Card>
          <ul className="flex flex-col gap-2 text-sm">
            {transport.map((t) => (
              <li key={t.id} className="flex items-start gap-2">
                <Bus aria-hidden size={18} className="mt-0.5 shrink-0 text-blue" />
                <span>
                  <b>{t.name}</b> (km {t.km}){t.note ? `: ${t.note}` : ''}
                </span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <Bus aria-hidden size={18} className="mt-0.5 shrink-0 text-blue" />
              <span>Táxi local: peça ao seu albergue ou café o contato de um táxi da região. (Contatos verificados entram com parceiros.)</span>
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted">Em emergência ligue 112. Transporte de mochilas e táxis só serão oferecidos com parceiros autorizados.</p>
        </Card>
      </section>
    </>
  );
}
