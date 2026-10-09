/**
 * Provedor REAL de roteamento a pé: OpenRouteService (perfil foot-hiking). Requer ORS_API_KEY.
 * Recalcula o traçado entre as paradas de cada rota mantendo atributos e paradas da base.
 * Atribuição obrigatória: "© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors".
 */
import type { LngLat, Route } from '@/lib/domain/types';
import { mockRouting } from '../mock';
import { ProviderNotConfiguredError, type RoutingProvider } from '../types';

async function directions(apiKey: string, coordinates: LngLat[]): Promise<LngLat[]> {
  const res = await fetch('https://api.openrouteservice.org/v2/directions/foot-hiking/geojson', {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates }),
  });
  if (!res.ok) throw new Error(`OpenRouteService HTTP ${res.status}`);
  const j = (await res.json()) as { features: { geometry: { coordinates: LngLat[] } }[] };
  return j.features[0]?.geometry.coordinates ?? coordinates;
}

export function createOpenRouteServiceProvider(apiKey = process.env.ORS_API_KEY): RoutingProvider {
  async function enrich(route: Route): Promise<Route> {
    if (!apiKey) throw new ProviderNotConfiguredError('OpenRouteService', 'ORS_API_KEY');
    const geometry = await directions(apiKey, route.stops.map((s) => s.coord));
    const now = new Date();
    return {
      ...route,
      geometry,
      source: 'OpenRouteService / OpenStreetMap',
      sourceUrl: 'https://openrouteservice.org/',
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
      isDemo: false,
    };
  }
  return {
    id: 'openrouteservice',
    async listRoutes() {
      return Promise.all((await mockRouting.listRoutes()).map(enrich));
    },
    async getRoute(id) {
      const base = await mockRouting.getRoute(id);
      return base ? enrich(base) : undefined;
    },
  };
}
