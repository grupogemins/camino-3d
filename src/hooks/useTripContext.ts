'use client';
import { getRoute } from '@/data/demo/routes';
import { useAppStore } from '@/store/useAppStore';

/** Rota e etapa atual da viagem ativa (ou da rota Central como exemplo). */
export function useTripContext() {
  const trip = useAppStore((s) => s.trip);
  const route = getRoute(trip?.routeId ?? 'central')!;
  const currentSegment = trip?.segments.find((s) => !trip.completedSegmentIds.includes(s.id)) ?? trip?.segments[0];
  const stopIds = trip ? [...new Set(trip.segments.flatMap((s) => [s.fromStopId, s.toStopId]))] : route.stops.map((s) => s.id);
  return { trip, route, currentSegment, stopIds };
}
