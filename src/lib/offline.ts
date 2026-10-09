'use client';
import type { LngLat } from '@/lib/domain/types';

export const OFFLINE_CACHE = 'camino-offline-v1';

/** Telas e dados essenciais guardados para uso sem sinal. */
export function offlineUrls(segmentIds: string[], stops: { id: string; coord: LngLat; name: string }[]) {
  const pages = ['/inicio', '/mapa', '/tradutor', '/seguranca', '/clima', '/diario', ...segmentIds.map((id) => `/etapas/${id}`)];
  const stopIds = stops.map((s) => s.id).join(',');
  const api = [
    `/api/places/accommodations?stopIds=${stopIds}`,
    `/api/places/restaurants?stopIds=${stopIds}`,
    ...stops.map((s) => `/api/weather?lat=${s.coord[1]}&lng=${s.coord[0]}&name=${encodeURIComponent(s.name)}`),
  ];
  return [...pages, ...api];
}

/** Baixa as URLs para o Cache Storage (lido pelo service worker quando offline). */
export async function downloadForOffline(segmentIds: string[], stops: { id: string; coord: LngLat; name: string }[]): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const urls = offlineUrls(segmentIds, stops);
    const results = await Promise.allSettled(urls.map((u) => cache.add(u)));
    return results.filter((r) => r.status === 'fulfilled').length >= Math.ceil(urls.length * 0.6);
  } catch {
    return false;
  }
}
