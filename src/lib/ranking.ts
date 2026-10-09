import type { SponsoredPlacement } from '@/lib/domain/types';

export interface Rankable {
  id: string;
  distanceFromRouteKm: number;
  review?: { rating: number; count: number };
  sponsored?: SponsoredPlacement;
}

/** Relevância orgânica: proximidade da rota + avaliação ponderada pelo volume. */
export function organicScore(p: Rankable): number {
  const proximity = 1 / (1 + p.distanceFromRouteKm);
  const rating = p.review ? (p.review.rating / 5) * Math.min(1, Math.log10(1 + p.review.count) / 3) : 0.3;
  return proximity * 0.5 + rating * 0.5;
}

function activeBoost(p: Rankable, now: Date): number {
  const s = p.sponsored;
  if (!s) return 0;
  const t = now.getTime();
  if (t < new Date(s.startsAt).getTime() || t > new Date(s.endsAt).getTime()) return 0;
  return Math.min(0.5, Math.max(0, s.boost));
}

/**
 * Ordena lugares. Patrocínio só ajusta a ordem (com teto) e o item continua marcado como "Patrocinado".
 * Itens filtrados (fechados, inacessíveis etc.) nunca voltam por patrocínio: filtre ANTES de ordenar.
 */
export function rankPlaces<T extends Rankable>(places: T[], now = new Date()): T[] {
  return [...places].sort((a, b) => organicScore(b) + activeBoost(b, now) * 0.3 - (organicScore(a) + activeBoost(a, now) * 0.3));
}

export function isSponsoredActive(p: Rankable, now = new Date()): boolean {
  return activeBoost(p, now) > 0;
}

/** Ordem orgânica pura (usada nas listas e no copiloto). Ofertas pagas aparecem em seção separada. */
export function rankOrganic<T extends Rankable>(places: T[]): T[] {
  return [...places].sort((a, b) => organicScore(b) - organicScore(a));
}
