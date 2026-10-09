import 'server-only';
import { TtlCache, withTimeout } from '@/lib/server/cache';
import { mockBilling, mockEvents, mockPlaces, mockRouting, mockTranslation, mockWeather } from './mock';
import { createDeepLProvider } from './real/deepl';
import { createOpenMeteoProvider } from './real/openMeteo';
import { createOpenRouteServiceProvider } from './real/openRouteService';
import { createGooglePlacesProvider } from './real/placesNotContracted';
import { createStripeProvider } from './real/stripe';
import type { BillingProvider, EventsProvider, PlacesProvider, ResponseMeta, RoutingProvider, TranslationProvider, WeatherProvider } from './types';

/**
 * Seleção de provedores por variável de ambiente. Padrão: mock (demonstração).
 * WEATHER_PROVIDER=open-meteo | ROUTING_PROVIDER=openrouteservice | PLACES_PROVIDER=google
 * TRANSLATION_PROVIDER=deepl | BILLING_PROVIDER=stripe (ou automático se STRIPE_SECRET_KEY existir)
 */
export function getProviders() {
  const env = process.env;
  const weather: WeatherProvider = env.WEATHER_PROVIDER === 'open-meteo' ? createOpenMeteoProvider() : mockWeather;
  const routing: RoutingProvider = env.ROUTING_PROVIDER === 'openrouteservice' ? createOpenRouteServiceProvider() : mockRouting;
  const places: PlacesProvider = env.PLACES_PROVIDER === 'google' ? createGooglePlacesProvider() : mockPlaces;
  const events: EventsProvider = mockEvents;
  const translation: TranslationProvider = env.TRANSLATION_PROVIDER === 'deepl' ? createDeepLProvider() : mockTranslation;
  const billing: BillingProvider = env.BILLING_PROVIDER === 'stripe' || env.STRIPE_SECRET_KEY ? createStripeProvider() : mockBilling;
  return { weather, routing, places, events, translation, billing };
}

export const MOCK_IDS = new Set([mockWeather.id, mockRouting.id, mockPlaces.id, mockEvents.id, mockTranslation.id, mockBilling.id]);

const cache = new TtlCache<{ data: unknown; meta: ResponseMeta }>();

interface RunOptions<T> {
  cacheKey: string;
  ttlMs: number;
  timeoutMs?: number;
  providerId: string;
  call: () => Promise<T>;
  /** Fallback de demonstração quando o provedor real falhar. */
  fallback?: { providerId: string; call: () => Promise<T> };
  source: (data: T) => string;
}

/** Executa um provedor com cache TTL, timeout, stale-if-error e fallback para demonstração. */
export async function runProvider<T>(opts: RunOptions<T>): Promise<{ data: T; meta: ResponseMeta }> {
  const hit = cache.get(opts.cacheKey);
  if (hit) return { data: hit.data as T, meta: { ...hit.meta, cached: true } };
  const isDemo = MOCK_IDS.has(opts.providerId);
  try {
    const data = await withTimeout(opts.call(), opts.timeoutMs ?? 6000);
    const meta: ResponseMeta = { provider: opts.providerId, isDemo, source: opts.source(data), fetchedAt: new Date().toISOString(), cached: false, fallback: false };
    cache.set(opts.cacheKey, { data, meta }, opts.ttlMs);
    return { data, meta };
  } catch (err) {
    console.error(`[provider:${opts.providerId}]`, err instanceof Error ? err.message : err);
    const stale = cache.getStale(opts.cacheKey);
    if (stale) {
      return { data: stale.data as T, meta: { ...stale.meta, cached: true, fallback: true, notice: 'Fonte indisponível: exibindo o último dado salvo.' } };
    }
    if (opts.fallback) {
      const data = await opts.fallback.call();
      return {
        data,
        meta: { provider: opts.fallback.providerId, isDemo: true, source: opts.source(data), fetchedAt: new Date().toISOString(), cached: false, fallback: true, notice: 'Fonte real indisponível: exibindo dados de demonstração.' },
      };
    }
    throw err;
  }
}

export function providerStatus() {
  const p = getProviders();
  return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { id: v.id, demo: MOCK_IDS.has(v.id) }]));
}
