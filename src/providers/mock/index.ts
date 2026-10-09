/** Provedores de DEMONSTRAÇÃO. Toda saída é marcada isDemo = true. */
import { accommodations, getAccommodation } from '@/data/demo/accommodations';
import { eventsForTrip, pointsOfInterest } from '@/data/demo/culture';
import { findPhrase } from '@/data/demo/phrases';
import { restaurants } from '@/data/demo/restaurants';
import { getRoute, routes } from '@/data/demo/routes';
import { demoWeather } from '@/data/demo/weather';
import type { BillingProvider, EventsProvider, PlaceQuery, PlacesProvider, RoutingProvider, TranslationProvider, WeatherProvider } from '../types';

function filterPlaces<T extends { stopId: string; distanceFromRouteKm: number }>(list: T[], q: PlaceQuery): T[] {
  return list.filter((p) => (!q.stopIds?.length || q.stopIds.includes(p.stopId)) && (q.maxDistanceKm === undefined || p.distanceFromRouteKm <= q.maxDistanceKm));
}

export const mockRouting: RoutingProvider = {
  id: 'mock-routing',
  listRoutes: async () => routes,
  getRoute: async (id) => getRoute(id),
};

export const mockWeather: WeatherProvider = {
  id: 'mock-weather',
  getForecast: async (coord, name) => demoWeather(coord, name),
};

export const mockPlaces: PlacesProvider = {
  id: 'mock-places',
  listAccommodations: async (q) => filterPlaces(accommodations, q),
  getAccommodation: async (id) => getAccommodation(id),
  listRestaurants: async (q) => filterPlaces(restaurants, q),
  listPointsOfInterest: async (q) => filterPlaces(pointsOfInterest, q),
};

export const mockEvents: EventsProvider = {
  id: 'mock-events',
  listEvents: async ({ startDate, stopIds }) => eventsForTrip(startDate).filter((e) => !stopIds?.length || stopIds.includes(e.stopId)),
};

export const mockTranslation: TranslationProvider = {
  id: 'mock-translation',
  async translate({ text, from, to }) {
    const phrase = findPhrase(text, from);
    const hit = phrase?.text[to];
    if (hit) return { text: hit, from, to, method: 'phrasebook' };
    return { text: `[Tradução simulada para ${to.toUpperCase()}] ${text}`, from, to, method: 'demo' };
  },
};

export const mockBilling: BillingProvider = {
  id: 'mock-billing',
  async createCheckout({ planId }) {
    return { mode: 'demo', sessionId: `demo_${planId}_${Date.now()}` };
  },
};
