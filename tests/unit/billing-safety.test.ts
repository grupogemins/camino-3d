import { describe, expect, it } from 'vitest';
import { effectivePlan, hasFeature, periodEndFor } from '@/lib/billing/plans';
import { sosReducer, SOS_COUNTDOWN_SECONDS, type SosState } from '@/lib/safety/sos';
import { isSponsoredActive, rankPlaces } from '@/lib/ranking';
import { moderateMessage } from '@/lib/moderation';
import { SlidingWindowLimiter } from '@/lib/server/rateLimit';
import { TtlCache } from '@/lib/server/cache';
import { retentionEventsDue, setAnalyticsConsent, track } from '@/lib/analytics/events';
import { weatherAdvice } from '@/lib/weatherAdvice';

describe('planos e direitos', () => {
  it('sem assinatura = gratuito, sem recursos premium', () => {
    expect(effectivePlan(null)).toBe('free');
    expect(hasFeature('free', 'offline_maps')).toBe(false);
    expect(hasFeature('free', 'essential_phrases')).toBe(true);
  });
  it('assinatura ativa no período libera premium; expirada ou cancelada não', () => {
    const now = new Date('2026-10-09');
    expect(effectivePlan({ plan: 'pass', status: 'active', currentPeriodEnd: '2026-11-01' }, now)).toBe('pass');
    expect(effectivePlan({ plan: 'pass', status: 'active', currentPeriodEnd: '2026-10-01' }, now)).toBe('free');
    expect(effectivePlan({ plan: 'monthly', status: 'cancelled', currentPeriodEnd: '2026-11-01' }, now)).toBe('free');
    expect(hasFeature('pass', 'voice_translator')).toBe(true);
  });
  it('Passe do Caminho dura 45 dias', () => {
    const from = new Date('2026-10-01T00:00:00Z');
    expect(new Date(periodEndFor('pass', from)!).getTime() - from.getTime()).toBe(45 * 86_400_000);
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
