import { describe, expect, it } from 'vitest';
import { APPROX_GRID_DEG, effectiveGranularity, isVisibleToOthers, preciseExpiry, publishableLocation } from '@/lib/privacy/location';

const now = new Date('2026-10-09T10:00:00Z');
const base = { userId: 'u1', coord: [-8.583612, 41.767234] as [number, number], cityName: 'Ponte de Lima', now };

describe('publishableLocation', () => {
  it('oculto não publica nada', () => {
    expect(publishableLocation({ ...base, granularity: 'hidden' })).toBeNull();
  });
  it('cidade não expõe coordenadas', () => {
    const l = publishableLocation({ ...base, granularity: 'city' })!;
    expect(l.coord).toBeNull();
    expect(l.cityName).toBe('Ponte de Lima');
  });
  it('aproximada arredonda para a grade de ~2 km e nunca devolve a posição real', () => {
    const l = publishableLocation({ ...base, granularity: 'approximate' })!;
    expect(l.coord).not.toEqual(base.coord);
    const [x, y] = l.coord!;
    expect(Math.abs(x / APPROX_GRID_DEG - Math.round(x / APPROX_GRID_DEG))).toBeLessThan(1e-9);
    expect(Math.abs(y / APPROX_GRID_DEG - Math.round(y / APPROX_GRID_DEG))).toBeLessThan(1e-9);
    expect(l.accuracyM).toBeGreaterThanOrEqual(1000);
  });
  it('precisa temporária expira automaticamente', () => {
    const exp = preciseExpiry(now, 60);
    expect(publishableLocation({ ...base, granularity: 'precise_temporary', preciseExpiresAt: exp })!.coord).toEqual(base.coord);
    const later = new Date(now.getTime() + 61 * 60_000);
    expect(publishableLocation({ ...base, now: later, granularity: 'precise_temporary', preciseExpiresAt: exp })).toBeNull();
  });
});

describe('visibilidade', () => {
  it('presença desligada por padrão significa invisível', () => {
    expect(isVisibleToOthers({ communityPresence: false, invisibleMode: false, locationGranularity: 'city' }, now)).toBe(false);
  });
  it('modo invisível vence qualquer granularidade', () => {
    expect(isVisibleToOthers({ communityPresence: true, invisibleMode: true, locationGranularity: 'approximate' }, now)).toBe(false);
  });
  it('preciso expirado vira oculto', () => {
    expect(effectiveGranularity('precise_temporary', '2026-10-09T09:00:00Z', now)).toBe('hidden');
    expect(isVisibleToOthers({ communityPresence: true, invisibleMode: false, locationGranularity: 'precise_temporary', preciseSharingExpiresAt: '2026-10-09T09:00:00Z' }, now)).toBe(false);
  });
});
