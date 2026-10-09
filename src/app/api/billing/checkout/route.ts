import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { applyCoupon } from '@/lib/billing/coupons';
import { getPlan } from '@/lib/billing/plans';
import { getProviders } from '@/providers/registry';
import { badRequest, rateLimit, serverError } from '@/lib/server/http';

const Body = z.object({
  planId: z.enum(['pass', 'group']),
  email: z.string().email().optional(),
  coupon: z.string().trim().max(32).optional(),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'billing', 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Plano inválido.');
  const { planId, email, coupon } = parsed.data;
  // O cupom é validado no servidor; o preço exibido no cliente é só informativo.
  const applied = coupon ? applyCoupon(planId, coupon) : null;
  if (applied && !applied.ok) return badRequest(applied.message);
  const priceEur = applied?.ok ? applied.priceEur : getPlan(planId).priceEur;
  const affiliateId = applied?.ok ? applied.affiliate?.id : undefined;
  const { billing } = getProviders();
  const origin = req.nextUrl.origin;
  try {
    const q = new URLSearchParams({ status: 'success', plan: planId, ...(applied?.ok ? { coupon: applied.code } : {}) });
    const result = await billing.createCheckout({
      planId,
      customerEmail: email,
      successUrl: `${origin}/premium?${q}`,
      cancelUrl: `${origin}/premium?status=cancelled`,
      couponCode: applied?.ok ? applied.code : undefined,
      affiliateId,
    });
    return NextResponse.json({
      data: { ...result, priceEur, couponCode: applied?.ok ? applied.code : undefined, affiliateId },
      meta: { provider: billing.id, isDemo: result.mode === 'demo', source: billing.id, fetchedAt: new Date().toISOString(), cached: false, fallback: false },
    });
  } catch (e) {
    return serverError(e);
  }
}
