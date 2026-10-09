import type { LngLat, LocationGranularity, UserLocation } from '@/lib/domain/types';

/** Duração padrão do compartilhamento preciso temporário. */
export const PRECISE_SHARING_MINUTES = 60;
/** Grade de arredondamento para posição aproximada (~0,02° ≈ 2 km). */
export const APPROX_GRID_DEG = 0.02;

export const GRANULARITY_OPTIONS: { id: LocationGranularity; label: string; description: string }[] = [
  { id: 'hidden', label: 'Oculta', description: 'Ninguém vê sua posição.' },
  { id: 'city', label: 'Somente cidade', description: 'Mostra apenas a cidade ou vila mais próxima.' },
  { id: 'approximate', label: 'Aproximada (~2 km)', description: 'Posição arredondada para uma área de cerca de 2 km.' },
  { id: 'precise_temporary', label: `Precisa por ${PRECISE_SHARING_MINUTES} min`, description: 'Posição exata, desligada automaticamente ao expirar.' },
];

function roundToGrid(value: number, grid: number) {
  return Math.round(value / grid) * grid;
}

export interface ObfuscateInput {
  userId: string;
  coord: LngLat;
  cityName: string;
  granularity: LocationGranularity;
  /** Momento atual (injetável para testes). */
  now?: Date;
  /** Expiração já definida para o modo preciso. */
  preciseExpiresAt?: string;
}

/**
 * Converte a posição real no que pode ser publicado, conforme a granularidade.
 * Retorna null quando nada deve ser publicado (oculto ou compartilhamento expirado).
 * A coordenada real NUNCA sai daqui para os modos 'city' e 'approximate'.
 */
export function publishableLocation(input: ObfuscateInput): UserLocation | null {
  const now = input.now ?? new Date();
  const updatedAt = now.toISOString();
  switch (input.granularity) {
    case 'hidden':
      return null;
    case 'city':
      return { userId: input.userId, granularity: 'city', coord: null, cityName: input.cityName, accuracyM: 10000, updatedAt };
    case 'approximate':
      return {
        userId: input.userId,
        granularity: 'approximate',
        coord: [roundToGrid(input.coord[0], APPROX_GRID_DEG), roundToGrid(input.coord[1], APPROX_GRID_DEG)],
        cityName: input.cityName,
        accuracyM: 2000,
        updatedAt,
      };
    case 'precise_temporary': {
      const expiresAt = input.preciseExpiresAt ?? preciseExpiry(now);
      if (new Date(expiresAt).getTime() <= now.getTime()) return null;
      return { userId: input.userId, granularity: 'precise_temporary', coord: input.coord, cityName: input.cityName, accuracyM: 30, expiresAt, updatedAt };
    }
  }
}

export function preciseExpiry(now = new Date(), minutes = PRECISE_SHARING_MINUTES): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

/** Granularidade efetiva: rebaixa para 'hidden' quando o compartilhamento preciso expirou. */
export function effectiveGranularity(granularity: LocationGranularity, expiresAt: string | undefined, now = new Date()): LocationGranularity {
  if (granularity === 'precise_temporary' && (!expiresAt || new Date(expiresAt).getTime() <= now.getTime())) {
    return 'hidden';
  }
  return granularity;
}

/** Usuário aparece para os outros somente com presença ligada, fora do modo invisível e com granularidade visível. */
export function isVisibleToOthers(settings: { communityPresence: boolean; invisibleMode: boolean; locationGranularity: LocationGranularity; preciseSharingExpiresAt?: string }, now = new Date()): boolean {
  if (!settings.communityPresence || settings.invisibleMode) return false;
  return effectiveGranularity(settings.locationGranularity, settings.preciseSharingExpiresAt, now) !== 'hidden';
}
