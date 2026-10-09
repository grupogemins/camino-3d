import { describe, expect, it } from 'vitest';
import { effectivePlan, getPlan, hasFeature } from '@/lib/billing/plans';
import { applyCoupon } from '@/lib/billing/coupons';
import { unitEconomics } from '@/lib/billing/economics';
import { sosReducer, SOS_COUNTDOWN_SECONDS, type SosState } from '@/lib/safety/sos';
import { isSponsoredActive, rankPlaces } from '@/lib/ranking';
import { moderateMessage } from '@/lib/moderation';
import { SlidingWindowLimiter } from '@/lib/server/rateLimit';
import { TtlCache } from '@/lib/server/cache';
import { retentionEventsDue, setAnalyticsConsent, track } from '@/lib/analytics/events';
import { weatherAdvice } from '@/lib/weatherAdvice';

describe('Camino Pass e direitos', () => {
  it('sem compra = gratuito, sem recursos do passe', () => {
    expect(effectivePlan(null)).toBe('free');
    expect(hasFeature('free', 'offline_maps')).toBe(false);
    expect(hasFeature('free', 'essential_phrases')).toBe(true);
    expect(hasFeature('free', 'retrospective')).toBe(false);
  });
  it('passe pago não expira; teste expira; reembolsado volta ao gratuito', () => {
    const now = new Date('2030-01-01');
    expect(effectivePlan({ plan: 'pass', status: 'active' }, now)).toBe('pass');
    expect(effectivePlan({ plan: 'pass', status: 'trialing', currentPeriodEnd: '2026-10-16' }, now)).toBe('free');
    expect(effectivePlan({ plan: 'group', status: 'cancelled' }, now)).toBe('free');
    expect(hasFeature('pass', 'copilot_full')).toBe(true);
    expect(getPlan('group').seats).toBe(4);
  });
});

describe('cupons e afiliados', () => {
  const now = new Date('2026-10-09');
  it('lançamento baixa o passe para 9,99 e o grupo para 29,99', () => {
    expect(applyCoupon('pass', 'lancamento', now)).toMatchObject({ ok: true, kind: 'launch', priceEur: 9.99, listPriceEur: 14.99 });
    expect(applyCoupon('group', 'LANCAMENTO', now)).toMatchObject({ ok: true, priceEur: 29.99 });
  });
  it('lançamento expira', () => {
    expect(applyCoupon('pass', 'LANCAMENTO', new Date('2027-06-01')).ok).toBe(false);
  });
  it('código de criador atribui a venda ao afiliado; afiliado pendente não vale', () => {
    const r = applyCoupon('pass', 'ANACAMINHA', now);
    expect(r.ok && r.affiliate?.id).toBe('aff-ana');
    expect(applyCoupon('pass', 'ROTANORTE', now).ok).toBe(false);
    expect(applyCoupon('pass', 'INVENTADO', now).ok).toBe(false);
  });
});

describe('economia por venda', () => {
  it('a margem cai com IVA, tarifa, afiliado e loja', () => {
    const web = unitEconomics({ priceEur: 14.99 });
    const affiliate = unitEconomics({ priceEur: 9.99, affiliateRate: 0.25 });
    const store = unitEconomics({ priceEur: 14.99, storeFeeRate: 0.15 });
    expect(web.contribution).toBeGreaterThan(affiliate.contribution);
    expect(store.contribution).toBeLessThan(web.contribution);
    expect(web.vat + web.processing + web.affiliate + web.variableCost + web.contribution + web.storeFee).toBeCloseTo(web.gross, 1);
  });
});

describe('SOS exige confirmação', () => {
  it('um toque só abre a confirmação; confirmar inicia contagem cancelável', () => {
    let s: SosState = { step: 'idle' };
    s = sosReducer(s, { type: 'press' });
    expect(s.step).toBe('confirming');
    s = sosReducer(s, { type: 'tick' });
    expect(s.step).toBe('confirming');
    s = sosReducer(s, { type: 'confirm' });
    expect(s).toEqual({ step: 'countdown', secondsLeft: SOS_COUNTDOWN_SECONDS });
    expect(sosReducer(s, { type: 'cancel' }).step).toBe('cancelled');
  });
  it('ativa somente após a contagem terminar', () => {
    let s: SosState = { step: 'countdown', secondsLeft: SOS_COUNTDOWN_SECONDS };
    for (let i = 0; i < SOS_COUNTDOWN_SECONDS - 1; i++) s = sosReducer(s, { type: 'tick' });
    expect(s.step).toBe('countdown');
    s = sosReducer(s, { type: 'tick' });
    expect(s.step).toBe('activated');
  });
  it('confirmar sem pressionar não faz nada', () => {
    expect(sosReducer({ step: 'idle' }, { type: 'confirm' }).step).toBe('idle');
  });
});

describe('patrocínio', () => {
  const now = new Date('2026-10-09');
  const orgBest = { id: 'a', distanceFromRouteKm: 0.1, review: { rating: 4.9, count: 800 } };
  const sponsored = { id: 'b', distanceFromRouteKm: 0.3, review: { rating: 4.5, count: 300 }, sponsored: { id: 's', sponsorId: 'x', label: 'Patrocinado' as const, placeId: 'b', startsAt: '2026-01-01', endsAt: '2027-01-01', boost: 0.5 } };
  it('fica identificado e com ganho limitado', () => {
    expect(isSponsoredActive(sponsored, now)).toBe(true);
    // o ganho do patrocínio é limitado: não supera um lugar claramente melhor e mais próximo
    expect(rankPlaces([orgBest, sponsored], now)[0].id).toBe('a');
    // mas desempata entre lugares equivalentes
    const twin = { ...sponsored, id: 'twin', sponsored: undefined };
    expect(rankPlaces([twin, sponsored], now)[0].id).toBe('b');
  });
  it('não ressuscita item muito pior organicamente', () => {
    const bad = { ...sponsored, id: 'c', distanceFromRouteKm: 5, review: { rating: 3, count: 2 } };
    expect(rankPlaces([orgBest, bad], now)[0].id).toBe('a');
  });
  it('patrocínio expirado não dá vantagem', () => {
    expect(isSponsoredActive({ ...sponsored, sponsored: { ...sponsored.sponsored, endsAt: '2026-02-01' } }, now)).toBe(false);
  });
});

describe('moderação e rate limit', () => {
  it('bloqueia ofensas, links, telefones e repetição', () => {
    expect(moderateMessage('Bom Caminho!').ok).toBe(true);
    expect(moderateMessage('seu idiota').reason).toBe('abusive');
    expect(moderateMessage('veja www.spam.com').reason).toBe('link');
    expect(moderateMessage('me liga +34 600 123 456').reason).toBe('phone');
    expect(moderateMessage('oi', ['oi', 'oi']).reason).toBe('repeated');
  });
  it('janela deslizante limita rajadas', () => {
    const l = new SlidingWindowLimiter(3, 1000);
    expect([0, 1, 2, 3].map((t) => l.check('k', t).allowed)).toEqual([true, true, true, false]);
    expect(l.check('k', 1500).allowed).toBe(true);
  });
  it('cache TTL expira mas mantém valor para fallback', () => {
    const c = new TtlCache<number>();
    c.set('a', 1, 100, 0);
    expect(c.get('a', 50)).toBe(1);
    expect(c.get('a', 150)).toBeUndefined();
    expect(c.getStale('a')).toBe(1);
  });
});

describe('analytics com consentimento', () => {
  it('não registra sem consentimento', () => {
    setAnalyticsConsent(false);
    expect(track('route_created')).toBe(false);
    setAnalyticsConsent(true);
    expect(track('route_created')).toBe(true);
    setAnalyticsConsent(false);
  });
  it('retenção D7/D30 uma única vez', () => {
    const due = retentionEventsDue('2026-09-01T00:00:00Z', new Date('2026-10-09'), ['retention_d7']);
    expect(due).toEqual(['retention_d30']);
  });
});

describe('recomendações de clima', () => {
  it('sugere capa de chuva e protetor', () => {
    const adv = weatherAdvice({
      current: { tempC: 22, feelsLikeC: 22, condition: 'clear', precipProb: 10, windKmh: 10, uvIndex: 7 },
      hourly: [{ time: '2026-10-09T12:00:00Z', tempC: 22, precipProb: 70, condition: 'rain' }],
      alerts: [],
      sunrise: '08:30',
    });
    expect(adv.some((a) => a.id === 'rain')).toBe(true);
    expect(adv.some((a) => a.id === 'uv')).toBe(true);
  });
});
