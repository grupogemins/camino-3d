import { describe, expect, it } from 'vitest';
import { accommodations } from '@/data/demo/accommodations';
import { activeReports, demoLive, displayCount } from '@/data/demo/live';
import { getRoute } from '@/data/demo/routes';
import { demoWeather } from '@/data/demo/weather';
import { copilotSuggestions } from '@/lib/copilot/copilot';
import type { Accommodation, Trip, WeatherSnapshot } from '@/lib/domain/types';
import { journeyStats, reachedCities, souvenirFor, timeOfDayFor, worldWeather } from '@/lib/journey';
import { intermediateLodgingStops, planStages, shortenStage } from '@/lib/planner/planner';

const route = getRoute('central')!;
const plan = planStages({ route, originId: 'porto', days: 10, dailyKm: 25, fitness: 'intermediate' });
const trip: Trip = {
  id: 't1', userId: 'u', routeId: 'central', mode: 'easiest', startDate: '2026-10-09', days: 10, dailyKm: 25,
  segments: plan.segments, status: 'planned', completedSegmentIds: [], createdAt: '', updatedAt: '',
};
const profile = { dailyKm: 25, dailyBudgetEur: 60, food: [], fitness: 'intermediate' as const };

/** Previsão com chuva forte a partir de uma hora local de Lisboa (UTC+1 em outubro). */
function rainyAt(localHour: number): WeatherSnapshot {
  const base = demoWeather([-8.6, 41.3], 'Teste', new Date('2026-10-09T05:00:00Z'));
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const t = new Date(Date.UTC(2026, 9, 9, i - 1)); // hora local = i
    return { time: t.toISOString(), tempC: 18, precipProb: i >= localHour ? 85 : 10, condition: i >= localHour ? ('rain' as const) : ('clear' as const) };
  });
  return { ...base, hourly, sunset: '19:40', isDemo: true };
}

describe('copiloto', () => {
  const seg = trip.segments[0];

  it('chuva no meio da etapa sugere sair mais cedo ou terminar antes, com fonte declarada', () => {
    const s = copilotSuggestions({ trip, route, segment: seg, profile, weather: rainyAt(13), accommodations });
    const w = s.find((x) => x.kind === 'weather');
    expect(w).toBeDefined();
    expect(w!.priority).toBe(0);
    expect(w!.basedOn.join(' ')).toMatch(/demonstração/);
    expect(w!.body).not.toMatch(/segur/i);
  });

  it('sem chuva prevista, não há alerta de clima', () => {
    const s = copilotSuggestions({ trip, route, segment: seg, profile, weather: rainyAt(30), accommodations });
    expect(s.some((x) => x.kind === 'weather')).toBe(false);
  });

  it('dois dias acima da média sugerem encurtar a etapa seguinte', () => {
    const i = trip.segments.findIndex((s, k) => k >= 2 && intermediateLodgingStops(route, s).length > 0);
    const walked: Trip = { ...trip, completedSegmentIds: [trip.segments[i - 2].id, trip.segments[i - 1].id] };
    const next = trip.segments[i];
    const s = copilotSuggestions({ trip: walked, route, segment: next, profile: { ...profile, dailyKm: 15 }, accommodations });
    const pace = s.find((x) => x.kind === 'pace');
    expect(pace?.actions[0].shorten?.segmentId).toBe(next.id);
  });

  it('lotação: recomenda só hospedagens com vaga, dentro do orçamento, sem influência de patrocínio', () => {
    const dest = seg.toStopId;
    const fake: Accommodation[] = accommodations.filter((a) => a.stopId === dest).slice(0, 1).flatMap((a) => [
      { ...a, id: 'full1', availability: 'full' as const },
      { ...a, id: 'full2', availability: 'full' as const },
      { ...a, id: 'ok-cheap', availability: 'available' as const, price: { ...a.price, amount: 15 } },
      { ...a, id: 'ok-expensive', availability: 'available' as const, price: { ...a.price, amount: 200 } },
    ]);
    const s = copilotSuggestions({ trip, route, segment: seg, profile, accommodations: fake });
    const l = s.find((x) => x.kind === 'lodging')!;
    expect(l).toBeDefined();
    const hrefs = l.actions.map((a) => a.href ?? '');
    expect(hrefs).toContain('/hospedagens/ok-cheap');
    expect(hrefs).not.toContain('/hospedagens/ok-expensive');
    expect(hrefs).not.toContain('/hospedagens/full1');
    expect(l.basedOn).toContain('Ordem orgânica (sem patrocínio)');
  });
});

describe('replanejar encurtando uma etapa', () => {
  it('termina na parada escolhida e mantém a viagem contínua até Santiago', () => {
    const seg = trip.segments.find((s) => route.stops.some((x) => x.services.lodging && x.km > s.startKm && x.km < s.endKm))!;
    const stop = route.stops.find((x) => x.services.lodging && x.km > seg.startKm && x.km < seg.endKm)!;
    const out = shortenStage(route, trip.segments, seg.id, stop.id, { daysTotal: 12, dailyKm: 25, fitness: 'intermediate' })!;
    const changed = out.find((s) => s.day === seg.day)!;
    expect(changed.toStopId).toBe(stop.id);
    expect(out.at(-1)!.toStopId).toBe('santiago');
    for (let i = 1; i < out.length; i++) expect(out[i].fromStopId).toBe(out[i - 1].toStopId);
    out.forEach((s, i) => expect(s.day).toBe(i + 1));
  });
  it('recusa parada fora da etapa', () => {
    expect(shortenStage(route, trip.segments, trip.segments[0].id, 'santiago', { daysTotal: 10, dailyKm: 25, fitness: 'intermediate' })).toBeNull();
  });
});

describe('Camino Live', () => {
  const now = new Date('2026-10-09T10:00:00Z');
  const snap = demoLive(route, now);
  it('só agrega por parada e esconde contagens pequenas', () => {
    expect(snap.stages.every((s) => !('coord' in s))).toBe(true);
    expect(displayCount(2)).toBe('menos de 3');
    expect(displayCount(7)).toBe('7');
    for (const s of snap.stages) for (const d of s.departures) expect(d.people).toBeGreaterThanOrEqual(3);
  });
  it('relatos expiram e somem quando marcados como "já não está"', () => {
    const r = snap.reports[0];
    expect(activeReports(snap.reports, {}, now).some((x) => x.id === r.id)).toBe(true);
    expect(activeReports(snap.reports, { [r.id]: 'gone' }, now).some((x) => x.id === r.id)).toBe(false);
    expect(activeReports(snap.reports, {}, new Date(now.getTime() + 13 * 3_600_000))).toHaveLength(0);
  });
});

describe('jornada', () => {
  it('cidades alcançadas viram lembranças e estatísticas', () => {
    const t: Trip = { ...trip, completedSegmentIds: [trip.segments[0].id, trip.segments[1].id] };
    const cities = reachedCities(t);
    expect(cities.map((c) => c.day)).toEqual([1, 2]);
    expect(journeyStats(t).stagesDone).toBe(2);
    expect(souvenirFor('barcelos', 'Barcelos')).toBe('Galo de Barcelos');
    expect(souvenirFor('xyz', 'Lugar')).toBe('Carimbo de Lugar');
  });
  it('hora do dia e clima do mundo 3D', () => {
    expect(timeOfDayFor(7)).toBe('dawn');
    expect(timeOfDayFor(13)).toBe('day');
    expect(timeOfDayFor(20)).toBe('dusk');
    expect(timeOfDayFor(23)).toBe('night');
    expect(worldWeather({ current: { condition: 'rain', tempC: 15, feelsLikeC: 14, precipProb: 90, windKmh: 10, uvIndex: 1 } })).toBe('rain');
  });
});
