import { affiliateByCode } from '@/data/demo/affiliates';
import type { Affiliate, PlanId } from '@/lib/domain/types';
import { getPlan } from './plans';

/** Preço promocional por plano (lançamento e audiência de afiliados). */
const PROMO_PRICE: Record<Exclude<PlanId, 'free'>, number> = { pass: 9.99, group: 29.99 };

export const LAUNCH_COUPON = { code: 'LANCAMENTO', validUntil: '2027-03-31T23:59:59Z' };

export type CouponResult =
  | { ok: true; code: string; kind: 'launch' | 'affiliate'; priceEur: number; listPriceEur: number; affiliate?: Affiliate }
  | { ok: false; message: string };

export function applyCoupon(planId: Exclude<PlanId, 'free'>, rawCode: string, now = new Date()): CouponResult {
  const code = rawCode.trim().toUpperCase();
  const listPriceEur = getPlan(planId).priceEur;
  if (!code) return { ok: false, message: 'Digite um cupom.' };
  if (code === LAUNCH_COUPON.code) {
    if (now.getTime() > new Date(LAUNCH_COUPON.validUntil).getTime()) return { ok: false, message: 'A oferta de lançamento terminou.' };
    return { ok: true, code, kind: 'launch', priceEur: PROMO_PRICE[planId], listPriceEur };
  }
  const affiliate = affiliateByCode(code);
  if (affiliate) return { ok: true, code, kind: 'affiliate', priceEur: PROMO_PRICE[planId], listPriceEur, affiliate };
  return { ok: false, message: 'Cupom não encontrado ou inativo.' };
}
