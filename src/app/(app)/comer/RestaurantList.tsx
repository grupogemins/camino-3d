'use client';
import { Bath, Clock, Droplets, MapPin, Plug, Sofa, UtensilsCrossed, Wifi } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { FavoriteButton, Price, Rating } from '@/components/places/PlaceBits';
import { PremiumHint } from '@/components/places/PremiumGate';
import { StopPicker } from '@/components/places/StopPicker';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ChipGroup, RangeField, Switch } from '@/components/ui/Controls';
import { DemoBadge, SourceLine, SponsoredBadge } from '@/components/ui/DataSource';
import { EmptyState, ErrorState, LoadingState, OfflineState } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import { FREE_LIMITS } from '@/lib/billing/plans';
import type { Restaurant } from '@/lib/domain/types';
import { filterRestaurants, limitPerStop, type RestaurantFilters } from '@/lib/filters';
import { isSponsoredActive, rankPlaces } from '@/lib/ranking';

const KIND = { cafe: 'Café', restaurant: 'Restaurante', bar: 'Bar', bakery: 'Padaria' } as const;

export function RestaurantList() {
  const params = useSearchParams();
  const { stopIds } = useTripContext();
  const { isPremium, can } = usePlan();
  const [f, setF] = useState<RestaurantFilters>({ stopId: params.get('parada') ?? 'all', pilgrimMenu: false, diets: [], amenities: [], maxPrice: 30, kinds: [] });
  const res = useApi<Restaurant[]>(`/api/places/restaurants?stopIds=${stopIds.join(',')}`);
  const set = (p: Partial<RestaurantFilters>) => setF((x) => ({ ...x, ...p }));
  const { visible, hidden } = useMemo(() => {
    const list = rankPlaces(filterRestaurants(res.data ?? [], f));
    return isPremium ? { visible: list, hidden: 0 } : limitPerStop(list, FREE_LIMITS.placesPerCategory);
  }, [res.data, f, isPremium]);

  return (
    <>
      <TopBar title="Cafés e restaurantes" back="/explorar" actions={<DemoBadge compact />} />
      <div className="flex flex-col gap-3">
        <StopPicker stopIds={stopIds} value={f.stopId} onChange={(stopId) => set({ stopId })} />
        <ChipGroup label="Tipo" value={f.kinds} onChange={(kinds) => set({ kinds })} options={(Object.keys(KIND) as Restaurant['kind'][]).map((id) => ({ id, label: KIND[id] }))} />
        <Switch checked={f.pilgrimMenu} onChange={(pilgrimMenu) => set({ pilgrimMenu })} label="Com menu do peregrino" />
        <ChipGroup
          label="Dieta"
          value={f.diets}
          onChange={(diets) => set({ diets })}
          options={[
            { id: 'vegetarian', label: 'Vegetariano' },
            { id: 'vegan', label: 'Vegano' },
            { id: 'glutenFree', label: 'Sem glúten' },
          ]}
        />
        {can('advanced_filters') ? (
          <>
            <ChipGroup
              label="Precisa de"
              value={f.amenities}
              onChange={(amenities) => set({ amenities })}
              options={[
                { id: 'waterRefill', label: 'Encher garrafa' },
                { id: 'toilet', label: 'Banheiro' },
                { id: 'sockets', label: 'Tomadas' },
                { id: 'wifi', label: 'Wi-Fi' },
                { id: 'restArea', label: 'Área de descanso' },
              ]}
            />
            <RangeField label="Preço médio máximo" value={f.maxPrice} min={3} max={30} unit="EUR" onChange={(maxPrice) => set({ maxPrice })} />
          </>
        ) : (
          <PremiumHint>Filtros por serviços (água, banheiro, tomadas, Wi-Fi) e preço estão no Premium.</PremiumHint>
        )}

        {res.status === 'loading' && <LoadingState label="Carregando lugares" />}
        {res.status === 'error' && <ErrorState description={res.error} onRetry={res.reload} />}
        {res.status === 'offline' && <OfflineState />}
        {res.data && visible.length === 0 && <EmptyState icon={<UtensilsCrossed aria-hidden size={32} className="text-muted" />} title="Nada encontrado com esses filtros" />}

        <ul className="flex flex-col gap-3">
          {visible.map((r) => (
            <li key={r.id}>
              <Card as="article" aria-labelledby={`r-${r.id}`}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="terracotta">{KIND[r.kind]}</Badge>
                      {r.pilgrimMenu && <Badge tone="green">Menu do peregrino</Badge>}
                      {isSponsoredActive(r) && <SponsoredBadge />}
                    </div>
                    <h2 id={`r-${r.id}`} className="mt-1 text-lg font-bold">{r.name}</h2>
                    <p className="flex items-center gap-1 text-sm text-muted"><MapPin aria-hidden size={14} />{r.town} · {r.distanceFromRouteKm} km da rota · {r.cuisine}</p>
                  </div>
                  <FavoriteButton id={r.id} name={r.name} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <Price price={r.avgPrice} suffix="preço médio" />
                  <Rating review={r.review} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm"><Clock aria-hidden size={14} /> {r.openingHours} (demo)</p>
                <ul className="mt-2 flex flex-wrap gap-1.5 text-xs" aria-label="Serviços">
                  {r.diets.vegetarian && <li><Badge>Vegetariano</Badge></li>}
                  {r.diets.vegan && <li><Badge>Vegano</Badge></li>}
                  {r.diets.glutenFree && <li><Badge>Sem glúten</Badge></li>}
                  {r.amenities.waterRefill && <li><Badge icon={<Droplets aria-hidden size={12} />}>Água</Badge></li>}
                  {r.amenities.toilet && <li><Badge icon={<Bath aria-hidden size={12} />}>Banheiro</Badge></li>}
                  {r.amenities.sockets && <li><Badge icon={<Plug aria-hidden size={12} />}>Tomadas</Badge></li>}
                  {r.amenities.wifi && <li><Badge icon={<Wifi aria-hidden size={12} />}>Wi-Fi</Badge></li>}
                  {r.amenities.restArea && <li><Badge icon={<Sofa aria-hidden size={12} />}>Descanso</Badge></li>}
                </ul>
                <SourceLine className="mt-2" source={r.avgPrice.source} fetchedAt={r.avgPrice.fetchedAt} isDemo={r.avgPrice.isDemo} estimate />
              </Card>
            </li>
          ))}
        </ul>
        {hidden > 0 && <PremiumHint>Mais {hidden} lugares no Premium.</PremiumHint>}
      </div>
    </>
  );
}
