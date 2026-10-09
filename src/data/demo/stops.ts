import type { RouteStop } from '@/lib/domain/types';
import { routes } from './routes';

/** Todas as paradas únicas das rotas de demonstração. */
export const allStops: RouteStop[] = (() => {
  const map = new Map<string, RouteStop>();
  for (const r of routes) for (const s of r.stops) if (!map.has(s.id)) map.set(s.id, s);
  return [...map.values()];
})();

export function getStop(id: string): RouteStop | undefined {
  return allStops.find((s) => s.id === id);
}
