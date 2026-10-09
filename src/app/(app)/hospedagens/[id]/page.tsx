'use client';
import { Check, ExternalLink, MapPin, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { SchematicMap } from '@/components/map/SchematicMap';
import { FavoriteButton, Price, Rating } from '@/components/places/PlaceBits';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { DemoBadge, SourceLine, SponsoredBadge } from '@/components/ui/DataSource';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState, LoadingState, Notice, OfflineState } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { useTripContext } from '@/hooks/useTripContext';
import { track } from '@/lib/analytics/events';
import type { Accommodation } from '@/lib/domain/types';
import { formatDate } from '@/lib/format';
import { ACCOMMODATION_LABEL, AVAILABILITY_LABEL } from '@/lib/labels';
import { isSponsoredActive } from '@/lib/ranking';

const AMENITY_LABEL: Record<keyof Accommodation['amenities'], string> = {
  breakfast: 'Café da manhã',
  laundry: 'Lavanderia',
  kitchen: 'Cozinha',
  bikeStorage: 'Guarda de bicicleta',
  privateRoom: 'Quarto privativo',
  dorm: 'Dormitório',
  petsAllowed: 'Aceita animais',
  freeCancellation: 'Cancelamento grátis',
};

export default function AccommodationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { route } = useTripContext();
  const res = useApi<Accommodation>(`/api/places/accommodations/${id}`);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (res.status === 'success') track('accommodation_viewed', { type: res.data.type });
  }, [res.status, res.data?.type]);

  if (res.status === 'loading') return (<><TopBar title="Hospedagem" back /><LoadingState /></>);
  if (res.status === 'error') return (<><TopBar title="Hospedagem" back /><ErrorState description={res.error} onRetry={res.reload} /></>);
  if (!res.data) return (<><TopBar title="Hospedagem" back /><OfflineState /></>);
  const a = res.data;

  return (
    <>
      <TopBar title={a.name} subtitle={a.town} back actions={<FavoriteButton id={a.id} name={a.name} />} />
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="green">{ACCOMMODATION_LABEL[a.type]}</Badge>
        {isSponsoredActive(a) && <SponsoredBadge />}
        {a.accessible && <Badge tone="blue">Acessível</Badge>}
        <DemoBadge />
      </div>
      <p className="mt-3">{a.description}</p>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Price price={a.price} suffix="por pessoa/noite" />
          <Badge tone={a.availability === 'full' ? 'danger' : a.availability === 'limited' ? 'warning' : 'neutral'}>{AVAILABILITY_LABEL[a.availability]}</Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div><dt className="text-muted">Moeda</dt><dd className="font-semibold">{a.price.currency}</dd></div>
          <div><dt className="text-muted">Taxas conhecidas</dt><dd className="font-semibold">{a.price.knownFees ?? 'Nenhuma informada'}</dd></div>
          <div><dt className="text-muted">Check-in a partir de</dt><dd className="font-semibold">{a.checkInFrom}</dd></div>
          {a.beds && <div><dt className="text-muted">Camas</dt><dd className="font-semibold">{a.beds}</dd></div>}
        </dl>
        {a.price.isEstimate && <Notice tone="warning">Preço estimado. O valor final é definido pelo estabelecimento ou fornecedor no momento da reserva.</Notice>}
        <SourceLine className="mt-2" source={a.price.source} fetchedAt={a.price.fetchedAt} isDemo={a.price.isDemo} estimate={a.price.isEstimate} />
        <Button
          className="mt-3"
          size="lg"
          block
          icon={<ExternalLink aria-hidden />}
          onClick={() => {
            track('booking_click', { type: a.type });
            setBookingOpen(true);
          }}
        >
          Consultar ou reservar no fornecedor
        </Button>
      </Card>

      <SectionTitle>Avaliações</SectionTitle>
      <Card>
        <Rating review={a.review} />
        {a.review && <p className="mt-1 text-xs text-muted">Fonte: {a.review.source} · coletado em {formatDate(a.review.fetchedAt)}</p>}
        <p className="mt-2 text-sm text-muted">Quando integrado, exibiremos somente avaliações de fontes oficiais (por exemplo, Google Places API), com fonte e data, conforme os termos do fornecedor.</p>
      </Card>

      <SectionTitle>Comodidades</SectionTitle>
      <ul className="grid grid-cols-2 gap-2">
        {(Object.keys(AMENITY_LABEL) as (keyof Accommodation['amenities'])[]).map((k) => (
          <li key={k} className={`flex items-center gap-2 rounded-xl p-2 text-sm ${a.amenities[k] ? 'bg-primary-soft' : 'bg-surface-2 text-muted'}`}>
            {a.amenities[k] ? <Check aria-hidden size={16} /> : <X aria-hidden size={16} />}
            <span>
              {AMENITY_LABEL[k]}
              <span className="sr-only">{a.amenities[k] ? ': sim' : ': não'}</span>
            </span>
          </li>
        ))}
      </ul>

      <SectionTitle>Localização</SectionTitle>
      <p className="mb-2 flex items-center gap-1 text-sm text-muted">
        <MapPin aria-hidden size={14} /> {a.distanceFromRouteKm.toLocaleString('pt-BR')} km do traçado em {a.town}
      </p>
      <SchematicMap
        height={260}
        data={{
          routeLine: route.geometry,
          markers: [{ id: a.id, coord: a.coord, kind: 'place', label: a.name, color: '#6d4c7d', glyph: 'Z' }],
          focus: [[a.coord[0] - 0.03, a.coord[1] - 0.03], [a.coord[0] + 0.03, a.coord[1] + 0.03]],
        }}
      />

      <Dialog
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        title="Reserva ainda não integrada"
        footer={<Button block onClick={() => setBookingOpen(false)}>Entendi</Button>}
      >
        <p>
          Este MVP não faz reservas. Quando houver um contrato com um fornecedor autorizado (API oficial ou programa de afiliados), este botão abrirá a página de reserva desse fornecedor, com preço e disponibilidade em tempo real.
        </p>
        <p className="mt-2 text-sm text-muted">Fornecedor configurado: {a.bookingProviders[0]?.name}. Nenhum dado seu foi enviado.</p>
      </Dialog>
    </>
  );
}
