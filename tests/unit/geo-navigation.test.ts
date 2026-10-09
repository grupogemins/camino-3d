import { describe, expect, it } from 'vitest';
import { getRoute } from '@/data/demo/routes';
import { haversineKm, projectOnLine } from '@/lib/geo/geo';
import { computeNavState, coordAtRouteKm, OFF_ROUTE_THRESHOLD_KM, routeKmAt } from '@/lib/navigation';
import { planStages } from '@/lib/planner/planner';

describe('geo', () => {
  it('haversine Porto → Santiago ~193 km em linha reta', () => {
    expect(haversineKm([-8.611, 41.1429], [-8.5446, 42.8806])).toBeGreaterThan(190);
    expect(haversineKm([-8.611, 41.1429], [-8.5446, 42.8806])).toBeLessThan(196);
  });
  it('projeta ponto na linha', () => {
    const p = projectOnLine([0.5, 0.001], [[0, 0], [1, 0]]);
    expect(p.distanceKm).toBeCloseTo(0.111, 2);
    expect(p.alongKm).toBeCloseTo(55.6, 0);
  });
});

describe('navegação', () => {
  const route = getRoute('central')!;
  const seg = planStages({ route, originId: 'porto', days: 12, dailyKm: 20, fitness: 'intermediate' }).segments[2];

  it('converte km da rota em coordenada e de volta', () => {
    const c = coordAtRouteKm(route, 100);
    expect(routeKmAt(route, c).km).toBeCloseTo(100, 0);
  });
  it('no traçado: não está fora da rota e calcula o que falta', () => {
    const mid = (seg.startKm + seg.endKm) / 2;
    const nav = computeNavState(route, seg, coordAtRouteKm(route, mid));
    expect(nav.offRoute).toBe(false);
    expect(nav.remainingStageKm).toBeCloseTo(seg.endKm - mid, 0);
    expect(nav.remainingTotalKm).toBeCloseTo(243 - mid, 0);
    expect(nav.etaMinutes).toBeGreaterThan(0);
  });
  it('alerta de saída da rota quando a mais de 150 m', () => {
    const c = coordAtRouteKm(route, (seg.startKm + seg.endKm) / 2);
    const nav = computeNavState(route, seg, [c[0] + 0.01, c[1]]);
    expect(nav.offRoute).toBe(true);
    expect(nav.distanceToRouteKm).toBeGreaterThan(OFF_ROUTE_THRESHOLD_KM);
  });
  it('chegada no fim da etapa', () => {
    expect(computeNavState(route, seg, coordAtRouteKm(route, seg.endKm)).arrived).toBe(true);
  });
});
