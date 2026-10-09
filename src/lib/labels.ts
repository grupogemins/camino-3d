import type { AccommodationType, Difficulty, Terrain, WaypointKind, WeatherCondition } from '@/lib/domain/types';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Fácil', moderate: 'Moderada', hard: 'Difícil' };
export const TERRAIN_LABEL: Record<Terrain, string> = {
  asphalt: 'Asfalto',
  dirt: 'Terra',
  gravel: 'Cascalho',
  cobblestone: 'Calçada de pedra',
  forest_trail: 'Trilha na mata',
  boardwalk: 'Passadiço de madeira',
};
export const WAYPOINT_LABEL: Record<WaypointKind, string> = {
  town: 'Vila',
  water: 'Água',
  toilet: 'Banheiro',
  pharmacy: 'Farmácia',
  health: 'Saúde',
  market: 'Mercado',
  shelter: 'Abrigo',
  rest: 'Descanso',
  danger: 'Atenção',
  no_signal: 'Sem sinal',
  detour: 'Desvio',
  transport: 'Transporte',
  viewpoint: 'Mirante',
};
export const ACCOMMODATION_LABEL: Record<AccommodationType, string> = {
  albergue: 'Albergue',
  hostel: 'Hostel',
  hotel: 'Hotel',
  pousada: 'Pousada',
  casa_rural: 'Casa rural',
  camping: 'Camping',
  religioso: 'Acolhida religiosa',
};
export const WEATHER_LABEL: Record<WeatherCondition, string> = {
  clear: 'Céu limpo',
  partly_cloudy: 'Parcialmente nublado',
  cloudy: 'Nublado',
  rain: 'Chuva',
  showers: 'Aguaceiros',
  storm: 'Trovoada',
  fog: 'Nevoeiro',
  wind: 'Vento forte',
};
export const AVAILABILITY_LABEL = { available: 'Vagas (demo)', limited: 'Poucas vagas (demo)', full: 'Lotado (demo)', unknown: 'Sem informação' } as const;
