import type {
  Difficulty,
  FitnessLevel,
  Route,
  RouteMode,
  RouteSegment,
  RouteStop,
  Terrain,
} from '@/lib/domain/types';

export const SPEED_KMH: Record<FitnessLevel, number> = {
  beginner: 3.5,
  intermediate: 4.2,
  advanced: 5,
};

export interface PlanInput {
  route: Route;
  originId: string;
  days: number;
  dailyKm: number;
  fitness: FitnessLevel;
}

export interface PlanWarning {
  code: 'too_few_days' | 'spare_days' | 'long_stage' | 'origin_not_on_route';
  message: string;
}

export interface PlanResult {
  routeId: string;
  segments: RouteSegment[];
  totalKm: number;
  totalAscentM: number;
  warnings: PlanWarning[];
  restDays: number;
}

/** Subida/descida estimada: diferença de altitude entre paradas + rugosidade do terreno. */
export function estimateElevation(route: Route, a: RouteStop, b: RouteStop) {
  const km = b.km - a.km;
  const roughnessPerKm = 6 + route.attributes.maxSlopePct * 0.6;
  const diff = b.elevationM - a.elevationM;
  const rough = Math.round(km * roughnessPerKm);
  return { ascentM: Math.max(0, diff) + rough, descentM: Math.max(0, -diff) + rough };
}

/** Tempo estimado (regra de Naismith simplificada: +1h a cada 600 m de subida). */
export function estimateHours(distanceKm: number, ascentM: number, fitness: FitnessLevel): number {
  const hours = distanceKm / SPEED_KMH[fitness] + ascentM / 600;
  return Math.round(hours * 10) / 10;
}

/** Dificuldade pelo "km-esforço" (km + 1 km a cada 100 m de subida). */
export function difficultyFor(distanceKm: number, ascentM: number): Difficulty {
  const effortKm = distanceKm + ascentM / 100;
  if (effortKm < 24) return 'easy';
  if (effortKm < 33) return 'moderate';
  return 'hard';
}

function terrainFor(route: Route, a: RouteStop, b: RouteStop): Terrain[] {
  if (route.id === 'costa' && (b.region === 'minho' || b.region === 'porto')) return ['boardwalk', 'cobblestone', 'asphalt'];
  if (route.id === 'costa') return ['asphalt', 'dirt', 'boardwalk'];
  if (b.region === 'minho') return ['cobblestone', 'dirt', 'forest_trail'];
  if (b.id === 'armenteira' || b.id === 'vilanova') return ['forest_trail', 'gravel'];
  if (a.region === 'galicia_sul') return ['asphalt', 'dirt'];
  return ['dirt', 'forest_trail', 'asphalt'];
}

/**
 * Divide a rota em etapas diárias.
 * Programação dinâmica sobre as paradas com hospedagem: escolhe exatamente N etapas
 * minimizando o desvio quadrático em relação à distância-alvo, com penalidade para etapas longas.
 */
export function planStages(input: PlanInput): PlanResult {
  const { route, originId, fitness } = input;
  const warnings: PlanWarning[] = [];
  const startIndex = route.stops.findIndex((s) => s.id === originId);
  if (startIndex < 0) {
    return {
      routeId: route.id,
      segments: [],
      totalKm: 0,
      totalAscentM: 0,
      restDays: 0,
      warnings: [{ code: 'origin_not_on_route', message: 'Esta rota não passa pela origem escolhida.' }],
    };
  }

  const candidates = route.stops.slice(startIndex).filter((s, i) => i === 0 || s.services.lodging);
  const start = candidates[0];
  const end = candidates[candidates.length - 1];
  const totalKm = end.km - start.km;
  const days = Math.max(1, Math.floor(input.days));
  const dailyKm = Math.max(5, input.dailyKm);

  const maxStages = candidates.length - 1;
  let stages = Math.max(1, Math.ceil(totalKm / dailyKm - 0.15));
  if (stages > days) {
    warnings.push({
      code: 'too_few_days',
      message: `Com ${days} dias seria preciso andar cerca de ${Math.round(totalKm / days)} km/dia, acima dos ${dailyKm} km desejados. Considere mais dias ou outra origem.`,
    });
    stages = days;
  }
  stages = Math.min(stages, maxStages);
  const restDays = Math.max(0, days - stages);
  if (restDays > 0) {
    warnings.push({ code: 'spare_days', message: `Sobram ${restDays} dia(s): ótimo para descanso ou para conhecer as cidades.` });
  }

  const target = totalKm / stages;
  const longLimit = Math.max(dailyKm * 1.35, 32);

  // dp[k][j] = menor custo para terminar a etapa k na parada j
  const n = candidates.length;
  const INF = Number.POSITIVE_INFINITY;
  const dp: number[][] = Array.from({ length: stages + 1 }, () => Array(n).fill(INF));
  const prev: number[][] = Array.from({ length: stages + 1 }, () => Array(n).fill(-1));
  dp[0][0] = 0;
  for (let k = 1; k <= stages; k++) {
    for (let j = 1; j < n; j++) {
      for (let i = 0; i < j; i++) {
        if (dp[k - 1][i] === INF) continue;
        const dist = candidates[j].km - candidates[i].km;
        const penalty = dist > longLimit ? (dist - longLimit) ** 2 * 10 : 0;
        const cost = dp[k - 1][i] + (dist - target) ** 2 + penalty;
        if (cost < dp[k][j]) {
          dp[k][j] = cost;
          prev[k][j] = i;
        }
      }
    }
  }

  const path: number[] = [n - 1];
  for (let k = stages, j = n - 1; k > 0; k--) {
    j = prev[k][j];
    path.unshift(j);
  }

  const segments: RouteSegment[] = [];
  let totalAscentM = 0;
  for (let d = 1; d < path.length; d++) {
    const a = candidates[path[d - 1]];
    const b = candidates[path[d]];
    const distanceKm = Math.round((b.km - a.km) * 10) / 10;
    const { ascentM, descentM } = estimateElevation(route, a, b);
    totalAscentM += ascentM;
    if (distanceKm > longLimit) {
      warnings.push({ code: 'long_stage', message: `A etapa ${d} (${a.name} → ${b.name}) tem ${distanceKm} km. Avalie dividir ou usar transporte de apoio.` });
    }
    segments.push({
      id: `${route.id}-d${d}-${a.id}-${b.id}`,
      routeId: route.id,
      day: d,
      fromStopId: a.id,
      toStopId: b.id,
      fromName: a.name,
      toName: b.name,
      startKm: a.km,
      endKm: b.km,
      distanceKm,
      estimatedHours: estimateHours(distanceKm, ascentM, fitness),
      ascentM,
      descentM,
      difficulty: difficultyFor(distanceKm, ascentM),
      terrain: terrainFor(route, a, b),
      waypoints: route.waypoints.filter((w) => w.km > a.km && w.km <= b.km),
    });
  }

  return { routeId: route.id, segments, totalKm, totalAscentM, warnings, restDays };
}

// ---------------- Pontuação por modo ----------------

export const ROUTE_MODES: { id: RouteMode; label: string; description: string }[] = [
  { id: 'fastest', label: 'Mais rápida', description: 'Menos quilômetros até Santiago.' },
  { id: 'easiest', label: 'Mais fácil', description: 'Menos subidas fortes e mais infraestrutura.' },
  { id: 'cheapest', label: 'Mais econômica', description: 'Hospedagem média mais barata.' },
  { id: 'safest', label: 'Mais segura (relativa)', description: 'Mais serviços, menos trânsito, menos trechos sem sinal. Nenhuma rota é 100% segura.' },
  { id: 'scenic', label: 'Mais bonita', description: 'Paisagem, patrimônio e natureza.' },
  { id: 'accessible', label: 'Mais acessível', description: 'Mais pavimento, menor inclinação e mais transporte de apoio.' },
  { id: 'quietest', label: 'Menos movimentada', description: 'Menos peregrinos por trecho.' },
  { id: 'social', label: 'Melhor para socializar', description: 'Mais peregrinos e albergues compartilhados.' },
];

export interface RouteScore {
  routeId: string;
  score: number;
  reasons: string[];
}

function countWaypoints(route: Route, kind: string, fromKm: number) {
  return route.waypoints.filter((w) => w.kind === kind && w.km >= fromKm).length;
}

/** Valor bruto (maior = melhor) de uma rota para o modo. Patrocínio NUNCA entra aqui. */
export function rawModeValue(route: Route, mode: RouteMode, originId = 'porto'): number {
  const a = route.attributes;
  const origin = route.stops.find((s) => s.id === originId);
  const fromKm = origin?.km ?? 0;
  const km = route.totalKm - fromKm;
  const transportShare = route.stops.filter((s) => s.km >= fromKm && s.services.transport).length / Math.max(1, route.stops.filter((s) => s.km >= fromKm).length);
  switch (mode) {
    case 'fastest':
      return 1000 / km;
    case 'easiest':
      return (1 - a.maxSlopePct / 25) * 0.6 + a.infrastructure * 0.4 - countWaypoints(route, 'danger', fromKm) * 0.03;
    case 'cheapest':
      return 1 / a.avgLodgingEur;
    case 'safest':
      return a.infrastructure * 0.4 + (1 - a.trafficExposure) * 0.3 + transportShare * 0.2 - countWaypoints(route, 'danger', fromKm) * 0.04 - countWaypoints(route, 'no_signal', fromKm) * 0.04;
    case 'scenic':
      return a.scenery;
    case 'accessible':
      return a.pavedShare * 0.4 + (1 - a.maxSlopePct / 25) * 0.4 + transportShare * 0.2;
    case 'quietest':
      return 1 - a.crowd;
    case 'social':
      return a.socialScore;
  }
}

const REASONS: Record<RouteMode, (r: Route, originKm: number) => string> = {
  fastest: (r, o) => `${r.totalKm - o} km até Santiago`,
  easiest: (r) => `Inclinação máxima ~${r.attributes.maxSlopePct}%`,
  cheapest: (r) => `Hospedagem média ~EUR ${r.attributes.avgLodgingEur}/noite (estimativa)`,
  safest: (r) => `Infraestrutura ${Math.round(r.attributes.infrastructure * 100)}%, exposição ao trânsito ${Math.round(r.attributes.trafficExposure * 100)}%`,
  scenic: (r) => `Paisagem ${Math.round(r.attributes.scenery * 10)}/10`,
  accessible: (r) => `${Math.round(r.attributes.pavedShare * 100)}% pavimentado, inclinação máx. ~${r.attributes.maxSlopePct}%`,
  quietest: (r) => `Movimento ${r.attributes.crowd < 0.4 ? 'baixo' : r.attributes.crowd < 0.7 ? 'médio' : 'alto'}`,
  social: (r) => `Socialização ${Math.round(r.attributes.socialScore * 10)}/10`,
};

/** Ordena as rotas para um modo, normalizando a pontuação de 0 a 100. */
export function rankRoutes(routes: Route[], mode: RouteMode, originId = 'porto'): RouteScore[] {
  const eligible = routes.filter((r) => r.stops.some((s) => s.id === originId));
  const values = eligible.map((r) => rawModeValue(r, mode, originId));
  const max = Math.max(...values);
  const min = Math.min(...values);
  return eligible
    .map((r, i) => {
      const originKm = r.stops.find((s) => s.id === originId)?.km ?? 0;
      const score = max === min ? 100 : Math.round(40 + ((values[i] - min) / (max - min)) * 60);
      return { routeId: r.id, score, reasons: [REASONS[mode](r, originKm)] };
    })
    .sort((a, b) => b.score - a.score);
}
