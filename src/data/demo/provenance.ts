import type { DataProvenance } from '@/lib/domain/types';

/** Data fixa de "coleta" dos dados de demonstração (para exibição de última atualização). */
export const DEMO_FETCHED_AT = '2026-10-01T08:00:00.000Z';

export const demoProvenance: DataProvenance = {
  source: 'Camino 3D — dados de demonstração (fictícios)',
  fetchedAt: DEMO_FETCHED_AT,
  expiresAt: '2026-12-31T23:59:59.000Z',
  isDemo: true,
};

export function demoProvenanceFrom(source: string): DataProvenance {
  return { ...demoProvenance, source: `${source} — demonstração` };
}
