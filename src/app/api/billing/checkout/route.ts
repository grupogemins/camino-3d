import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getProviders } from '@/providers/registry';
import { badRequest, rateLimit, serverError } from '@/lib/server/http';

const Body = z.object({ planId: z.enum(['pass', 'monthly']), email: z.string().email().optional() });

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'billing', 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Plano inválido.');
  const { billing } = getProviders();
  const origin = req.nextUrl.origin;
  try {
    const result = await billing.createCheckout({
      planId: parsed.data.planId,
      customerEmail: parsed.data.email,
      successUrl: `${origin}/premium?status=success&plan=${parsed.data.planId}`,
      cancelUrl: `${origin}/premium?status=cancelled`,
    });
    return NextResponse.json({ data: result, meta: { provider: billing.id, isDemo: result.mode === 'demo', source: billing.id, fetchedAt: new Date().toISOString(), cached: false, fallback: false } });
  } catch (e) {
    return serverError(e);
  }
}
