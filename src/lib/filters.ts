import type { Accommodation, AccommodationType, Restaurant } from '@/lib/domain/types';

export type AmenityKey = keyof Accommodation['amenities'] | 'accessible';

export interface AccommodationFilters {
  stopId: string | 'all';
  types: AccommodationType[];
  maxPrice: number;
  maxDistanceKm: number;
  minRating: number;
  minReviews: number;
  onlyAvailable: boolean;
  amenities: AmenityKey[];
  checkInBy?: string;
}

export const DEFAULT_ACC_FILTERS: AccommodationFilters = {
  stopId: 'all',
  types: [],
  maxPrice: 150,
  maxDistanceKm: 2,
  minRating: 0,
  minReviews: 0,
  onlyAvailable: false,
  amenities: [],
};

export function filterAccommodations(list: Accommodation[], f: AccommodationFilters): Accommodation[] {
  return list.filter((a) => {
    if (f.stopId !== 'all' && a.stopId !== f.stopId) return false;
    if (f.types.length && !f.types.includes(a.type)) return false;
    if (a.price.amount > f.maxPrice) return false;
    if (a.distanceFromRouteKm > f.maxDistanceKm) return false;
    if ((a.review?.rating ?? 0) < f.minRating) return false;
    if ((a.review?.count ?? 0) < f.minReviews) return false;
    if (f.onlyAvailable && !(a.availability === 'available' || a.availability === 'limited')) return false;
    for (const k of f.amenities) {
      if (k === 'accessible' ? !a.accessible : !a.amenities[k]) return false;
    }
    if (f.checkInBy && a.checkInFrom > f.checkInBy) return false;
    return true;
  });
}

/** Limita resultados no plano gratuito: N por parada. */
export function limitPerStop<T extends { stopId: string }>(list: T[], perStop: number): { visible: T[]; hidden: number } {
  const counts = new Map<string, number>();
  const visible: T[] = [];
  for (const item of list) {
    const c = counts.get(item.stopId) ?? 0;
    if (c < perStop) visible.push(item);
    counts.set(item.stopId, c + 1);
  }
  return { visible, hidden: list.length - visible.length };
}

export interface RestaurantFilters {
  stopId: string | 'all';
  pilgrimMenu: boolean;
  diets: Array<'vegetarian' | 'vegan' | 'glutenFree'>;
  amenities: Array<keyof Restaurant['amenities']>;
  maxPrice: number;
  kinds: Restaurant['kind'][];
}

export function filterRestaurants(list: Restaurant[], f: RestaurantFilters): Restaurant[] {
  return list.filter((r) => {
    if (f.stopId !== 'all' && r.stopId !== f.stopId) return false;
    if (f.pilgrimMenu && !r.pilgrimMenu) return false;
    if (f.kinds.length && !f.kinds.includes(r.kind)) return false;
    if (r.avgPrice.amount > f.maxPrice) return false;
    for (const d of f.diets) if (!r.diets[d]) return false;
    for (const a of f.amenities) if (!r.amenities[a]) return false;
    return true;
  });
}
