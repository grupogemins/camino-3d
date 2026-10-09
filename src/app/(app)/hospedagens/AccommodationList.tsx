'use client';
import { BedDouble, MapPin, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { FavoriteButton, Price, Rating } from '@/components/places/PlaceBits';
import { PremiumHint } from '@/components/places/PremiumGate';
import { StopPicker } from '@/components/places/StopPicker';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChipGroup, RangeField, Switch } from '@/components/ui/Controls';
import { DemoBadge, SourceLine } from '@/components/ui/DataSource';
import { EmptyState, ErrorState, LoadingState, OfflineState } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import { FREE_LIMITS } from '@/lib/billing/plans';
import type { Accommodation, AccommodationType } from '@/lib/domain/types';
import { DEFAULT_ACC_FILTERS, filterAccommodations, limitPerStop, type AccommodationFilters, type AmenityKey } from '@/lib/filters';
import { ACCOMMODATION_LABEL, AVAILABILITY_LABEL } from '@/lib/labels';
import { rankOrganic } from '@/lib/ranking';
import { PartnerOffers } from '@/components/places/PartnerOffers';

const AMENITIES: { id: AmenityKey; label: string }[] = [
  { id: 'breakfast', label: 'Café da manhã' },
  { id: 'laundry', label: 'Lavanderia' },
  { id: 'kitchen', label: 'Cozinha' },
  { id: 'bikeStorage', label: 'Guarda de bicicleta' },
  { id: 'privateRoom', label: 'Quarto privativo' },
  { id: 'dorm', label: 'Dormitório' },
  { id: 'accessible', label: 'Acessível' },
  { id: 'petsAllowed', label: 'Aceita animais' },
  { id: 'freeCancellation', label: 'Cancelamento grátis' },
];

export function AccommodationList() {
  const params = useSearchParams();
  const { stopIds } = useTripContext();
  const { can, isPremium } = usePlan();
  const [filters, setFilters] = useState<AccommodationFilters>({ ...DEFAULT_ACC_FILTERS, stopId: params.get('parada') ?? 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const res = useApi<Accommodation[]>(`/api/places/accommodations?stopIds=${stopIds.join(',')}`);
  const advanced = can('advanced_filters');
  const set = (patch: Partial<AccommodationFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const { visible, hidden } = useMemo(() => {
    const filtered = rankOrganic(filterAccommodations(res.data ?? [], filters));
    return isPremium ? { visible: filtered, hidden: 0 } : limitPerStop(filtered, FREE_LIMITS.placesPerCategory);
  }, [res.data, filters, isPremium]);

  return (
    <>
      <TopBar title="Hospedagens" back="/explorar" actions={<DemoBadge compact />} />
      <div className="flex flex-col gap-3">
        <StopPicker stopIds={stopIds} value={filters.stopId} onChange={(v) => set({ stopId: v })} />
        <ChipGroup label="Tipo" value={filters.types} onChange={(types) => set({ types })} options={(Object.keys(ACCOMMODATION_LABEL) as AccommodationType[]).map((id) => ({ id, label: ACCOMMODATION_LABEL[id] }))} />
        <Button variant="outline" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} icon={<SlidersHorizontal aria-hidden size={18} />}>
          {showFilters ? 'Ocultar filtros' : 'Mais filtros'}
        </Button>
        {showFilters && (
          <Card className="flex flex-col gap-4">
            <RangeField label="Preço máximo por noite" value={filters.maxPrice} min={10} max={150} step={5} unit="EUR" onChange={(maxPrice) => set({ maxPrice })} />
            {advanced ? (
              <>
                <RangeField label="Distância máxima da rota" value={filters.maxDistanceKm} min={0.2} max={2} step={0.1} unit="km" onChange={(maxDistanceKm) => set({ maxDistanceKm })} />
                <RangeField label="Avaliação mínima" value={filters.minRating} min={0} max={4.8} step={0.1} unit="★" onChange={(minRating) => set({ minRating })} />
                <RangeField label="Mínimo de avaliações" value={filters.minReviews} min={0} max={500} step={10} unit="" onChange={(minReviews) => set({ minReviews })} />
                <Switch checked={filters.onlyAvailable} onChange={(onlyAvailable) => set({ onlyAvailable })} label="Somente com disponibilidade" description="Disponibilidade de demonstração; confirme no fornecedor." />
                <ChipGroup label="Comodidades" options={AMENITIES} value={filters.amenities} onChange={(amenities) => set({ amenities })} />
                <ChipGroup
                  label="Check-in a partir de, no máximo"
                  single
                  value={[filters.checkInBy ?? 'any']}
                  onChange={(v) => set({ checkInBy: v[0] === 'any' ? undefined : v[0] })}
                  options={[
                    { id: 'any', label: 'Qualquer' },
                    { id: '12:00', label: '12:00' },
                    { id: '13:00', label: '13:00' },
                    { id: '14:00', label: '14:00' },
                  ]}
                />
              </>
            ) : (
              <PremiumHint>Filtros por distância, avaliação, disponibilidade, comodidades e check-in estão no Camino Pass.</PremiumHint>
            )}
          </Card>
        )}

        {res.status === 'loading' && <LoadingState label="Carregando hospedagens" />}
        {res.status === 'error' && <ErrorState description={res.error} onRetry={res.reload} />}
        {res.status === 'offline' && !res.data && <OfflineState description="Sem conexão e sem lista salva. Baixe a rota para uso offline quando tiver sinal." />}
        {res.status === 'offline' && res.data && <OfflineState />}
        {res.meta?.notice && <p className="text-sm font-semibold text-warning">{res.meta.notice}</p>}

        {res.data && visible.length === 0 && <EmptyState icon={<BedDouble aria-hidden className="text-muted" size={32} />} title="Nenhuma hospedagem com esses filtros" description="Tente aumentar o preço máximo ou remover comodidades." action={<Button variant="outline" onClick={() => setFilters({ ...DEFAULT_ACC_FILTERS, stopId: filters.stopId })}>Limpar filtros</Button>} />}

        {res.data && <PartnerOffers places={res.data.filter((p) => filters.stopId === 'all' || p.stopId === filters.stopId)} basePath='/hospedagens' />}
        <ul className="flex flex-col gap-3">
          {visible.map((a) => (
            <li key={a.id}>
              <Card as="article" aria-labelledby={`acc-${a.id}`}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="green">{ACCOMMODATION_LABEL[a.type]}</Badge>
                      <Badge tone={a.availability === 'full' ? 'danger' : a.availability === 'limited' ? 'warning' : 'neutral'}>{AVAILABILITY_LABEL[a.availability]}</Badge>
                    </div>
                    <h2 id={`acc-${a.id}`} className="mt-1 text-lg font-bold">
                      <Link href={`/hospedagens/${a.id}`} className="hover:underline">
                        {a.name}
                      </Link>
                    </h2>
                    <p className="flex items-center gap-1 text-sm text-muted">
                      <MapPin aria-hidden size={14} /> {a.town} · {a.distanceFromRouteKm.toLocaleString('pt-BR')} km da rota
                    </p>
                  </div>
                  <FavoriteButton id={a.id} name={a.name} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <Price price={a.price} suffix="/noite" />
                  <Rating review={a.review} />
                </div>
                <SourceLine className="mt-2" source={a.price.source} fetchedAt={a.price.fetchedAt} isDemo={a.price.isDemo} estimate={a.price.isEstimate} />
              </Card>
            </li>
          ))}
        </ul>
        {hidden > 0 && <PremiumHint>Mais {hidden} hospedagens disponíveis no Camino Pass (o plano gratuito mostra até {FREE_LIMITS.placesPerCategory} por parada).</PremiumHint>}
        <p className="text-xs text-muted">Ofertas de parceiros são publicidade, ficam separadas e nunca alteram a ordem da lista nem alertas de segurança. Avaliações e preços desta versão são fictícios.</p>
      </div>
    </>
  );
}
