'use client';
import { useMemo } from 'react';
import { weatherUrl } from '@/components/weather/WeatherMini';
import { demoAffiliates, creatorRoute } from '@/data/demo/affiliates';
import { getStop } from '@/data/demo/stops';
import { useApi } from '@/hooks/useApi';
import { useLive } from '@/hooks/useLive';
import { useTripContext } from '@/hooks/useTripContext';
import { copilotSuggestions, type Suggestion } from '@/lib/copilot/copilot';
import type { Accommodation, Restaurant, WeatherSnapshot } from '@/lib/domain/types';
import { intermediateLodgingStops } from '@/lib/planner/planner';
import { useAppStore } from '@/store/useAppStore';

/** Reúne os dados da etapa atual e calcula as sugestões do copiloto. */
export function useCopilot() {
  const { trip, route, currentSegment: seg } = useTripContext();
  const profile = useAppStore((s) => s.profile);
  const dismissed = useAppStore((s) => s.copilotDismissed);
  const { reports } = useLive();
  const dest = seg ? getStop(seg.toStopId) : undefined;
  const stopIds = seg ? [seg.fromStopId, ...intermediateLodgingStops(route, seg).map((s) => s.id), seg.toStopId] : [];
  const weather = useApi<WeatherSnapshot>(dest ? weatherUrl(dest.coord, dest.name) : null);
  const acc = useApi<Accommodation[]>(seg ? `/api/places/accommodations?stopIds=${stopIds.join(',')}` : null);
  const food = useApi<Restaurant[]>(seg ? `/api/places/restaurants?stopIds=${seg.toStopId}` : null);

  const creator = trip?.creatorRouteId ? creatorRoute(trip.creatorRouteId) : undefined;
  const tip = creator && seg ? creator.tips.find((t) => t.stopId === seg.toStopId || t.stopId === seg.fromStopId) : undefined;
  const author = creator ? demoAffiliates.find((a) => a.id === creator.affiliateId)?.name : undefined;

  const loading = weather.status === 'loading' || acc.status === 'loading' || food.status === 'loading';
  const suggestions: Suggestion[] = useMemo(() => {
    if (!trip || !seg) return [];
    return copilotSuggestions({
      trip,
      route,
      segment: seg,
      profile,
      weather: weather.data,
      accommodations: acc.data,
      restaurants: food.data,
      reports,
      creatorTip: tip && author ? { author, text: tip.text } : undefined,
    });
  }, [trip, route, seg, profile, weather.data, acc.data, food.data, reports, tip, author]);

  const today = new Date().toISOString().slice(0, 10);
  const visible = suggestions.filter((s) => !dismissed[s.id]?.startsWith(today));
  return { trip, segment: seg, suggestions: visible, loading };
}
