import { describe, expect, it } from 'vitest';
import { getRoute, routes } from '@/data/demo/routes';
import { difficultyFor, estimateHours, planStages, rankRoutes } from '@/lib/planner/planner';

const central = getRoute('central')!;

describe('planStages', () => {
  it('divide Porto → Santiago em etapas contínuas que terminam em Santiago', () => {
    const plan = planStages({ route: central, originId: 'porto', days: 12, dailyKm: 20, fitness: 'beginner' });
    expect(plan.segments.length).toBeGreaterThanOrEqual(10);
    expect(plan.segments[0].fromStopId).toBe('porto');
    expect(plan.segments.at(-1)!.toStopId).toBe('santiago');
    for (let i = 1; i < plan.segments.length; i++) expect(plan.segments[i].fromStopId).toBe(plan.segments[i - 1].toStopId);
    const sum = plan.segments.reduce((a, s) => a + s.distanceKm, 0);
    expect(Math.round(sum)).toBe(243);
  });

  it('nunca usa mais etapas que os dias disponíveis e avisa quando o ritmo é alto', () => {
    const plan = planStages({ route: central, originId: 'porto', days: 6, dailyKm: 20, fitness: 'advanced' });
    expect(plan.segments.length).toBe(6);
    expect(plan.warnings.some((w) => w.code === 'too_few_days')).toBe(true);
  });

  it('sugere dias de descanso quando sobram dias', () => {
    const plan = planStages({ route: central, originId: 'tui', days: 10, dailyKm: 25, fitness: 'intermediate' });
    expect(plan.restDays).toBeGreaterThan(0);
  });

  it('retorna aviso quando a origem não está na rota', () => {
    const plan = planStages({ route: getRoute('costa')!, originId: 'tui', days: 6, dailyKm: 20, fitness: 'beginner' });
    expect(plan.segments).toHaveLength(0);
    expect(plan.warnings[0].code).toBe('origin_not_on_route');
  });

  it('as etapas ficam próximas da distância desejada', () => {
    const plan = planStages({ route: central, originId: 'porto', days: 30, dailyKm: 20, fitness: 'beginner' });
    for (const s of plan.segments) expect(s.distanceKm).toBeLessThanOrEqual(33);
  });
});

describe('estimativas', () => {
  it('tempo cresce com a subida e é menor para quem tem melhor condicionamento', () => {
    expect(estimateHours(20, 600, 'beginner')).toBeGreaterThan(estimateHours(20, 0, 'beginner'));
    expect(estimateHours(20, 0, 'advanced')).toBeLessThan(estimateHours(20, 0, 'beginner'));
  });
  it('dificuldade por km-esforço', () => {
    expect(difficultyFor(15, 100)).toBe('easy');
    expect(difficultyFor(25, 300)).toBe('moderate');
    expect(difficultyFor(30, 600)).toBe('hard');
  });
});

describe('rankRoutes', () => {
  it('compara as três rotas a partir do Porto com pontuação de 40 a 100', () => {
    const r = rankRoutes(routes, 'scenic', 'porto');
    expect(r).toHaveLength(3);
    expect(r[0].routeId).toBe('costa');
    for (const s of r) {
      expect(s.score).toBeGreaterThanOrEqual(40);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });
  it('modo mais rápida prefere a menor distância', () => {
    expect(rankRoutes(routes, 'fastest', 'porto')[0].routeId).toBe('central');
  });
  it('modo menos movimentada prefere a variante espiritual', () => {
    expect(rankRoutes(routes, 'quietest', 'porto')[0].routeId).toBe('espiritual');
  });
  it('exclui rotas que não passam pela origem', () => {
    expect(rankRoutes(routes, 'easiest', 'tui').map((r) => r.routeId)).not.toContain('costa');
  });
});
