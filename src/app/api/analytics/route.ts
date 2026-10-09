import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { badRequest, rateLimit } from '@/lib/server/http';

const Body = z.object({
  anonymousId: z.string().max(64),
  events: z.array(z.object({ name: z.enum(ANALYTICS_EVENTS), at: z.string(), props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional() })).max(50),
});

/** Recebe eventos SOMENTE enviados com consentimento. No MVP apenas registra; em produção grava em analytics_events. */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'analytics', 120);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Payload inválido.');
  if (process.env.NODE_ENV !== 'production') console.info('[analytics]', parsed.data.events.map((e) => e.name).join(', '));
  return NextResponse.json({ accepted: parsed.data.events.length });
}
