import { POINTS_PER_LEG } from '@/data/demo/routes';
import type { LngLat, Route, RouteSegment, RouteStop, Waypoint } from '@/lib/domain/types';
import { haversineKm, pointAlongLine, projectOnLine } from '@/lib/geo/geo';
import { SPEED_KMH } from '@/lib/planner/planner';
import type { FitnessLevel } from '@/lib/domain/types';

/** Distância (km) a partir da qual o usuário é considerado fora da rota. */
export const OFF_ROUTE_THRESHOLD_KM = 0.15;

function cumulative(line: LngLat[]): number[] {
  const out = [0];
  for (let i = 1; i < line.length; i++) out.push(out[i - 1] + haversineKm(line[i - 1], line[i]));
  return out;
}

const cache = new WeakMap<Route, number[]>();
function cumFor(route: Route) {
  let c = cache.get(route);
  if (!c) {
    c = cumulative(route.geometry);
    cache.set(route, c);
  }
  return c;
}

/** Converte km "oficial" da rota em coordenada sobre o traçado. */
export function coordAtRouteKm(route: Route, km: number): LngLat {
  const stops = route.stops;
  const cum = cumFor(route);
  if (km <= stops[0].km) return route.geometry[0];
  for (let leg = 0; leg < stops.length - 1; leg++) {
    const a = stops[leg];
    const b = stops[leg + 1];
    if (km <= b.km) {
      const t = (km - a.km) / (b.km - a.km || 1);
      const startAlong = cum[leg * POINTS_PER_LEG];
      const endAlong = cum[(leg + 1) * POINTS_PER_LEG];
      return pointAlongLine(route.geometry, startAlong + t * (endAlong - startAlong));
    }
  }
  return route.geometry[route.geometry.length - 1];
}

/** Converte uma posição em km "oficial" da rota (projeção no traçado). */
export function routeKmAt(route: Route, position: LngLat): { km: number; distanceToRouteKm: number; snapped: LngLat } {
  const proj = projectOnLine(position, route.geometry);
  const cum = cumFor(route);
  const leg = Math.min(route.stops.length - 2, Math.floor(proj.segmentIndex / POINTS_PER_LEG));
  const startAlong = cum[leg * POINTS_PER_LEG];
  const endAlong = cum[(leg + 1) * POINTS_PER_LEG];
  const t = Math.max(0, Math.min(1, (proj.alongKm - startAlong) / (endAlong - startAlong || 1)));
  const a = route.stops[leg];
  const b = route.stops[leg + 1];
  return { km: a.km + t * (b.km - a.km), distanceToRouteKm: proj.distanceKm, snapped: proj.point };
}

export interface NavState {
  km: number;
  offRoute: boolean;
  distanceToRouteKm: number;
  remainingStageKm: number;
  remainingTotalKm: number;
  stageProgress: number;
  nextStop?: RouteStop;
  nextWaypoint?: Waypoint;
  etaMinutes: number;
  arrived: boolean;
}

export function computeNavState(route: Route, segment: RouteSegment, position: LngLat, fitness: FitnessLevel = 'intermediate'): NavState {
  const { km, distanceToRouteKm } = routeKmAt(route, position);
  const clampedKm = Math.max(segment.startKm, Math.min(segment.endKm, km));
  const remainingStageKm = Math.max(0, segment.endKm - clampedKm);
  const lastKm = route.stops[route.stops.length - 1].km;
  const nextStop = route.stops.find((s) => s.km > clampedKm + 0.05 && s.km <= segment.endKm);
  const nextWaypoint = route.waypoints.filter((w) => w.km > clampedKm + 0.05 && w.km <= segment.endKm).sort((a, b) => a.km - b.km)[0];
  return {
    km: clampedKm,
    offRoute: distanceToRouteKm > OFF_ROUTE_THRESHOLD_KM,
    distanceToRouteKm,
    remainingStageKm,
    remainingTotalKm: Math.max(0, lastKm - clampedKm),
    stageProgress: (clampedKm - segment.startKm) / (segment.distanceKm || 1),
    nextStop,
    nextWaypoint,
    etaMinutes: Math.round((remainingStageKm / SPEED_KMH[fitness]) * 60),
    arrived: remainingStageKm < 0.05,
  };
}

export interface Instruction {
  km: number;
  text: string;
}

/** Instruções passo a passo simplificadas a partir das paradas e pontos de interesse da etapa. */
export function stageInstructions(route: Route, segment: RouteSegment): Instruction[] {
  const marks = [
    ...route.stops.filter((s) => s.km > segment.startKm && s.km <= segment.endKm).map((s) => ({ km: s.km, text: s.km === segment.endKm ? `Chegada em ${s.name}` : `Atravesse ${s.name}` })),
    ...segment.waypoints.map((w) => ({ km: w.km, text: w.name })),
  ].sort((a, b) => a.km - b.km);
  const out: Instruction[] = [{ km: segment.startKm, text: `Saia de ${segment.fromName} seguindo as setas amarelas` }];
  let prev = segment.startKm;
  for (const m of marks) {
    const d = Math.round((m.km - prev) * 10) / 10;
    out.push({ km: m.km, text: d > 0 ? `Siga ${d.toLocaleString('pt-BR')} km: ${m.text}` : m.text });
    prev = m.km;
  }
  return out;
}
