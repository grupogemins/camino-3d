'use client';
import { CalendarDays, Church, Clock, Landmark, MapPin, Music, PartyPopper, ShoppingBasket, Ticket, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { DemoBadge, SourceLine } from '@/components/ui/DataSource';
import { EmptyState, ErrorState, LoadingState, OfflineState } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { useTripContext } from '@/hooks/useTripContext';
import type { Event, PointOfInterest } from '@/lib/domain/types';
import { formatEur } from '@/lib/format';

const EVENT_ICON = { festival: PartyPopper, fair: ShoppingBasket, concert: Music, religious: Church, market: ShoppingBasket, gastronomy: UtensilsCrossed };
const POI_ICON = { church: Church, monument: Landmark, museum: Landmark, market: ShoppingBasket, viewpoint: MapPin, bridge: Landmark };

export default function CulturaPage() {
  const { trip, stopIds } = useTripContext();
  const [tab, setTab] = useState<'events' | 'places'>('events');
  const start = trip?.startDate ?? new Date().toISOString().slice(0, 10);
  const events = useApi<Event[]>(tab === 'events' ? `/api/events?start=${start}&stopIds=${stopIds.join(',')}` : null);
  const pois = useApi<PointOfInterest[]>(tab === 'places' ? `/api/places/pois?stopIds=${stopIds.join(',')}` : null);
  const res = tab === 'events' ? events : pois;

  return (
    <>
      <TopBar title="Eventos e cultura" back="/explorar" actions={<DemoBadge compact />} />
      <Segmented label="Conteúdo" hideLabel value={tab} onChange={setTab} options={[{ id: 'events', label: 'Eventos nas suas datas' }, { id: 'places', label: 'Lugares e costumes' }]} />
      <div className="mt-3 flex flex-col gap-3">
        {res.status === 'loading' && <LoadingState />}
        {res.status === 'error' && <ErrorState description={res.error} onRetry={res.reload} />}
        {res.status === 'offline' && <OfflineState />}
        {tab === 'events' && events.data && (
          events.data.length === 0 ? <EmptyState title="Nenhum evento nas suas datas" /> : (
            <ul className="flex flex-col gap-3">
              {[...events.data].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map((e) => {
                const Icon = EVENT_ICON[e.category];
                const d = new Date(e.startsAt);
                return (
                  <li key={e.id}>
                    <Card as="article" className="flex gap-3">
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-terracotta-soft p-2 text-terracotta">
                        <span className="text-xl font-extrabold leading-none">{d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'Europe/Madrid' })}</span>
                        <span className="text-xs font-bold uppercase">{d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'Europe/Madrid' })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="flex items-center gap-1.5 font-bold"><Icon aria-hidden size={16} className="text-terracotta" />{e.title}</h2>
                        <p className="text-sm">{e.description}</p>
                        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
                          <span className="inline-flex items-center gap-1"><MapPin aria-hidden size={13} />{e.town}</span>
                          <span className="inline-flex items-center gap-1"><Clock aria-hidden size={13} />{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}</span>
                          <span className="inline-flex items-center gap-1"><Ticket aria-hidden size={13} />{e.priceEur ? formatEur(e.priceEur) : 'Gratuito'}</span>
                        </p>
                        <SourceLine className="mt-1" source={e.provenance.source} fetchedAt={e.provenance.fetchedAt} isDemo={e.provenance.isDemo} />
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )
        )}
        {tab === 'places' && pois.data && (
          <>
            <ul className="flex flex-col gap-3">
              {pois.data.map((p) => {
                const Icon = POI_ICON[p.category];
                return (
                  <li key={p.id}>
                    <Card as="article">
                      <h2 className="flex items-center gap-2 text-lg font-bold"><Icon aria-hidden size={18} className="text-primary" />{p.name}</h2>
                      <p className="text-sm text-muted">{p.town}</p>
                      <p className="mt-1">{p.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.openingHours && <Badge icon={<CalendarDays aria-hidden size={12} />}>{p.openingHours}</Badge>}
                        {p.price && <Badge>{p.price.amount ? formatEur(p.price.amount) : 'Entrada gratuita'}</Badge>}
                      </div>
                      {p.etiquette && <p className="mt-2 rounded-xl bg-blue-soft p-2 text-sm text-blue"><b>Etiqueta:</b> {p.etiquette}</p>}
                      <SourceLine className="mt-2" source={p.provenance.source} fetchedAt={p.provenance.fetchedAt} isDemo={p.provenance.isDemo} />
                    </Card>
                  </li>
                );
              })}
            </ul>
            <SectionTitle>Costumes no Caminho</SectionTitle>
            <Card>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>Cumprimente com &quot;Bom Caminho&quot; em Portugal e &quot;Buen Camino&quot; na Galiza.</li>
                <li>Na Espanha o almoço costuma ser entre 13h30 e 15h30 e o jantar depois das 20h30.</li>
                <li>Albergues públicos geralmente não aceitam reservas e fecham as portas por volta das 22h.</li>
                <li>Ao cruzar o rio Minho, ajuste o relógio: a Espanha está uma hora à frente de Portugal.</li>
                <li>Carimbe a credencial ao menos duas vezes por dia nos últimos 100 km para a Compostela oficial.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
