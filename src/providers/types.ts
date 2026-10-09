import type {
  Accommodation,
  Event,
  LngLat,
  PointOfInterest,
  Restaurant,
  Route,
  WeatherSnapshot,
} from '@/lib/domain/types';
import type { LangCode } from '@/data/demo/phrases';
import type { PlanId } from '@/lib/domain/types';

/** Metadados devolvidos por toda resposta de API. O cliente usa isso para o selo de demonstração. */
export interface ResponseMeta {
  provider: string;
  isDemo: boolean;
  source: string;
  fetchedAt: string;
  cached: boolean;
  /** true quando o provedor real falhou e a resposta veio do cache antigo ou do mock. */
  fallback: boolean;
  notice?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ApiError {
  error: { code: string; message: string };
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, envVar: string) {
    super(`Provedor ${provider} não configurado: defina ${envVar}.`);
  }
}

export interface RoutingProvider {
  id: string;
  listRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route | undefined>;
}

export interface WeatherProvider {
  id: string;
  getForecast(coord: LngLat, locationName: string): Promise<WeatherSnapshot>;
}

export interface PlaceQuery {
  stopIds?: string[];
  maxDistanceKm?: number;
}

export interface PlacesProvider {
  id: string;
  listAccommodations(q: PlaceQuery): Promise<Accommodation[]>;
  getAccommodation(id: string): Promise<Accommodation | undefined>;
  listRestaurants(q: PlaceQuery): Promise<Restaurant[]>;
  listPointsOfInterest(q: PlaceQuery): Promise<PointOfInterest[]>;
}

export interface EventsProvider {
  id: string;
  listEvents(q: { startDate: string; stopIds?: string[] }): Promise<Event[]>;
}

export interface TranslationResult {
  text: string;
  from: LangCode;
  to: LangCode;
  /** 'phrasebook' = frase offline revisada; 'machine' = tradução automática; 'demo' = simulada. */
  method: 'phrasebook' | 'machine' | 'demo';
}

export interface TranslationProvider {
  id: string;
  translate(input: { text: string; from: LangCode; to: LangCode }): Promise<TranslationResult>;
}

export interface CheckoutResult {
  mode: 'stripe' | 'demo';
  url?: string;
  sessionId: string;
}

export interface BillingProvider {
  id: string;
  createCheckout(input: {
    planId: Exclude<PlanId, 'free'>;
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
    /** Cupom já validado no servidor (lançamento ou afiliado). */
    couponCode?: string;
    affiliateId?: string;
  }): Promise<CheckoutResult>;
}
