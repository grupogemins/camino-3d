/** Estado da jornada: progresso, cidades alcançadas, lembranças, hora do dia e clima do mundo 3D. */
import type { Route, Trip, WeatherSnapshot } from '@/lib/domain/types';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type WorldWeather = 'clear' | 'rain' | 'cold' | 'hot';

export function timeOfDayFor(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 8.5) return 'dawn';
  if (hour >= 8.5 && hour < 19) return 'day';
  if (hour >= 19 && hour < 21.5) return 'dusk';
  return 'night';
}

/** Hora local (decimal) num fuso. */
export function hourIn(timeZone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).formatToParts(now);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? 12) + Number(parts.find((p) => p.type === 'minute')?.value ?? 0) / 60;
}

export function worldWeather(w: Pick<WeatherSnapshot, 'current'> | null | undefined): WorldWeather {
  if (!w) return 'clear';
  const { condition, feelsLikeC, tempC } = w.current;
  if (condition === 'rain' || condition === 'showers' || condition === 'storm') return 'rain';
  if (feelsLikeC <= 6) return 'cold';
  if (tempC >= 27) return 'hot';
  return 'clear';
}

/** Lembrança simbólica de cada cidade (elementos culturais públicos, sem marcas). */
const SOUVENIRS: Record<string, string> = {
  porto: 'Azulejo da Sé do Porto',
  barcelos: 'Galo de Barcelos',
  pontedelima: 'Ponte medieval sobre o Lima',
  rubiaes: 'Calçada romana',
  tui: 'Catedral-fortaleza de Tui',
  porrino: 'Variante do rio Louro',
  redondela: 'Viadutos sobre a ria',
  pontevedra: 'Capela da Peregrina',
  caldas: 'Fonte termal',
  padron: 'Pedrón e pimentos',
  santiago: 'Vieira dourada de Santiago',
  viladoconde: 'Aqueduto de Vila do Conde',
  esposende: 'Farol de Esposende',
  viana: 'Basílica de Santa Luzia',
  caminha: 'Torre do Relógio',
  baiona: 'Réplica da caravela Pinta',
  vigo: 'Ilhas Cíes no horizonte',
  combarro: 'Hórreos à beira-mar',
  armenteira: 'Mosteiro de Armenteira',
  vilanova: 'Traslatio pela ria de Arousa',
};

export function souvenirFor(stopId: string, name: string): string {
  return SOUVENIRS[stopId] ?? `Carimbo de ${name}`;
}

export interface ReachedCity {
  stopId: string;
  name: string;
  day: number;
  segmentId: string;
  completedAt?: string;
  souvenir: string;
}

export function reachedCities(trip: Trip): ReachedCity[] {
  return trip.segments
    .filter((s) => trip.completedSegmentIds.includes(s.id))
    .sort((a, b) => a.day - b.day)
    .map((s) => ({ stopId: s.toStopId, name: s.toName, day: s.day, segmentId: s.id, completedAt: trip.completedAt?.[s.id], souvenir: souvenirFor(s.toStopId, s.toName) }));
}

export interface JourneyStats {
  walkedKm: number;
  totalKm: number;
  ascentM: number;
  stagesDone: number;
  stagesTotal: number;
  hours: number;
  progress: number;
}

export function journeyStats(trip: Trip): JourneyStats {
  const done = trip.segments.filter((s) => trip.completedSegmentIds.includes(s.id));
  const walkedKm = Math.round(done.reduce((a, s) => a + s.distanceKm, 0) * 10) / 10;
  const totalKm = Math.round(trip.segments.reduce((a, s) => a + s.distanceKm, 0) * 10) / 10;
  return {
    walkedKm,
    totalKm,
    ascentM: done.reduce((a, s) => a + s.ascentM, 0),
    stagesDone: done.length,
    stagesTotal: trip.segments.length,
    hours: Math.round(done.reduce((a, s) => a + s.estimatedHours, 0) * 10) / 10,
    progress: totalKm ? walkedKm / totalKm : 0,
  };
}

/** Região do mundo 3D: a da cidade onde o peregrino está (último destino alcançado). */
export function currentRegion(route: Route, trip: Trip) {
  const reached = reachedCities(trip);
  const stopId = reached.length ? reached[reached.length - 1].stopId : trip.segments[0]?.fromStopId;
  return route.stops.find((s) => s.id === stopId)?.region ?? 'porto';
}
