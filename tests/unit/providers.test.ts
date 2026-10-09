import { describe, expect, it } from 'vitest';
import { accommodations } from '@/data/demo/accommodations';
import { restaurants } from '@/data/demo/restaurants';
import { demoPilgrims } from '@/data/demo/pilgrims';
import { mockTranslation } from '@/providers/mock';
import { runProvider } from '@/providers/registry';
import { filterAccommodations, DEFAULT_ACC_FILTERS, limitPerStop } from '@/lib/filters';

describe('dados de demonstração são sempre identificados', () => {
  it('preços e avaliações marcados como demo e estimativa, com fonte e data', () => {
    for (const a of accommodations) {
      expect(a.price.isDemo).toBe(true);
      expect(a.price.isEstimate).toBe(true);
      expect(a.price.source).toMatch(/demonstração/i);
      expect(a.price.fetchedAt).toBeTruthy();
      expect(a.review?.isDemo).toBe(true);
    }
    for (const r of restaurants) expect(r.provenance.isDemo).toBe(true);
    for (const p of demoPilgrims) expect(p.isDemo).toBe(true);
  });
  it('peregrinos fictícios nunca expõem posição exata fora do modo preciso', () => {
    for (const p of demoPilgrims) if (p.location?.granularity === 'city') expect(p.location.coord).toBeNull();
  });
  it('patrocinados sempre com rótulo', () => {
    for (const a of accommodations.filter((x) => x.sponsored)) expect(a.sponsored!.label).toBe('Patrocinado');
  });
});

describe('camada de provedores', () => {
  it('tradução usa frase revisada quando existe e marca simulação quando não', async () => {
    expect((await mockTranslation.translate({ text: 'Preciso de ajuda, por favor.', from: 'pt', to: 'es' })).method).toBe('phrasebook');
    expect((await mockTranslation.translate({ text: 'texto livre', from: 'pt', to: 'es' })).method).toBe('demo');
  });
  it('falha do provedor real cai para demonstração identificada', async () => {
    const r = await runProvider({
      cacheKey: 'test-fail',
      ttlMs: 1000,
      providerId: 'open-meteo',
      call: async () => {
        throw new Error('down');
      },
      fallback: { providerId: 'mock-weather', call: async () => ({ ok: 1 }) },
      source: () => 'x',
    });
    expect(r.meta.fallback).toBe(true);
    expect(r.meta.isDemo).toBe(true);
    expect(r.meta.notice).toMatch(/demonstração/);
  });
});

describe('filtros e limites do plano gratuito', () => {
  it('filtra por preço e comodidade', () => {
    const list = filterAccommodations(accommodations, { ...DEFAULT_ACC_FILTERS, maxPrice: 20, amenities: ['kitchen'] });
    expect(list.every((a) => a.price.amount <= 20 && a.amenities.kitchen)).toBe(true);
  });
  it('limita a 3 por parada', () => {
    const { visible, hidden } = limitPerStop(accommodations, 3);
    const counts = new Map<string, number>();
    visible.forEach((a) => counts.set(a.stopId, (counts.get(a.stopId) ?? 0) + 1));
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3);
    expect(hidden).toBe(accommodations.length - visible.length);
  });
});
