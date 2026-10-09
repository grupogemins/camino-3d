/**
 * CAMINO LIVE DE DEMONSTRAÇÃO: contagens agregadas, relatos e convites fictícios.
 * Estáveis por rota e dia. Em produção vêm do banco (contagens só por etapa, nunca posições).
 */
import type { LiveInvite, LiveReport, Route } from '@/lib/domain/types';
import { between, hashString, pick, seeded } from './seed';

export interface StageLive {
  stopId: string;
  /** Peregrinos com presença ativa que dormem/partem desta parada hoje. */
  pilgrims: number;
  languages: Record<string, number>;
  openToWalk: number;
  departures: { time: string; people: number }[];
}

export interface LiveSnapshot {
  routeId: string;
  stages: StageLive[];
  reports: LiveReport[];
  invites: LiveInvite[];
  generatedAt: string;
  isDemo: true;
}

/** Abaixo deste número a contagem aparece como "menos de 3" (anonimato). */
export const MIN_VISIBLE_COUNT = 3;

const LANGS = ['pt', 'es', 'en', 'de', 'it', 'fr', 'ko', 'pl'];

const REPORTS: Pick<LiveReport, 'kind' | 'note'>[] = [
  { kind: 'mud', note: 'Lama no trilho da floresta depois da chuva. Dá para passar pela borda.' },
  { kind: 'no_water', note: 'Fonte sem água hoje. Próxima no café da vila.' },
  { kind: 'works', note: 'Obras na estrada: desvio sinalizado com setas amarelas.' },
  { kind: 'queue', note: 'Fila no albergue municipal desde as 13h.' },
  { kind: 'crowded', note: 'Muitos peregrinos saindo juntos às 7h. Às 8h está mais calmo.' },
  { kind: 'tip', note: 'Café aberto cedo na saída da cidade, com carimbo.' },
  { kind: 'closed', note: 'Farmácia fechada para almoço até às 16h.' },
];

const PLACES = ['Praça principal', 'Café junto à igreja', 'Porta da catedral', 'Ponte velha', 'Mercado municipal'];

export function demoLive(route: Route, now = new Date()): LiveSnapshot {
  const day = now.toISOString().slice(0, 10);
  const rnd = seeded(hashString(`live-${route.id}-${day}`));
  const lodgingStops = route.stops.filter((s) => s.services.lodging);
  const stages: StageLive[] = lodgingStops.map((s) => {
    const pilgrims = Math.round(between(rnd, 0, 60) * (s.id === 'santiago' ? 2 : 1));
    const languages: Record<string, number> = {};
    let left = pilgrims;
    for (const l of LANGS) {
      if (left <= 0) break;
      const n = Math.min(left, Math.round(between(rnd, 0, pilgrims / 2)));
      if (n > 0) languages[l] = n;
      left -= n;
    }
    const openToWalk = Math.round(pilgrims * between(rnd, 0.1, 0.35, 2));
    const departures = pilgrims >= MIN_VISIBLE_COUNT ? ['06:30', '07:00', '07:30', '08:00'].map((time) => ({ time, people: Math.round(between(rnd, 0, pilgrims / 3)) })).filter((d) => d.people >= MIN_VISIBLE_COUNT) : [];
    return { stopId: s.id, pilgrims, languages, openToWalk, departures };
  });
  const reports: LiveReport[] = Array.from({ length: 6 }, (_, i) => {
    const r = pick(rnd, REPORTS);
    const stop = pick(rnd, lodgingStops.slice(0, -1));
    const ageH = between(rnd, 0.3, 9, 1);
    const created = new Date(now.getTime() - ageH * 3_600_000);
    return { id: `live-demo-${day}-${i}`, routeId: route.id, stopId: stop.id, ...r, createdAt: created.toISOString(), expiresAt: new Date(created.getTime() + 12 * 3_600_000).toISOString(), confirmations: Math.round(between(rnd, 0, 9)), isDemo: true };
  });
  const invites: LiveInvite[] = Array.from({ length: 4 }, (_, i) => {
    const stop = pick(rnd, lodgingStops.slice(0, -1));
    const kind = (['walk', 'coffee', 'dinner', 'event'] as const)[i % 4];
    const hour = kind === 'walk' ? 7 : kind === 'coffee' ? 16 : kind === 'dinner' ? 20 : 18;
    const startsAt = new Date(`${day}T${String(hour - 2).padStart(2, '0')}:00:00Z`).toISOString();
    const title = kind === 'walk' ? 'Caminhar juntos amanhã cedo' : kind === 'coffee' ? 'Café e conversa' : kind === 'dinner' ? 'Jantar de peregrinos' : 'Missa do peregrino e passeio';
    return { id: `inv-demo-${day}-${i}`, stopId: stop.id, kind, title, placeName: pick(rnd, PLACES), startsAt, going: Math.round(between(rnd, 2, 9)), hostName: pick(rnd, ['Marta', 'Jonas', 'Chiara', 'Pierre', 'Hana']), isDemo: true };
  });
  return { routeId: route.id, stages, reports, invites, generatedAt: now.toISOString(), isDemo: true };
}

/** Relatos ainda válidos, sem os marcados como "não está mais assim" pelo usuário. */
export function activeReports(reports: LiveReport[], votes: Record<string, 'confirm' | 'gone'>, now = new Date()): LiveReport[] {
  return reports
    .filter((r) => new Date(r.expiresAt).getTime() > now.getTime() && votes[r.id] !== 'gone')
    .map((r) => (votes[r.id] === 'confirm' ? { ...r, confirmations: r.confirmations + 1 } : r))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function displayCount(n: number): string {
  return n < MIN_VISIBLE_COUNT ? 'menos de 3' : String(n);
}
