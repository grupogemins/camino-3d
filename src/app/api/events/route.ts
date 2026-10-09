import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getProviders, runProvider } from '@/providers/registry';
import { badRequest, rateLimit, serverError } from '@/lib/server/http';

const Query = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stopIds: z.string().optional().transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
});

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'events', 60);
  if (limited) return limited;
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest('Parâmetro start (AAAA-MM-DD) obrigatório.');
  const { events } = getProviders();
  try {
    const result = await runProvider({
      cacheKey: `events:${events.id}:${req.nextUrl.search}`,
      ttlMs: 60 * 60_000,
      providerId: events.id,
      call: () => events.listEvents({ startDate: parsed.data.start, stopIds: parsed.data.stopIds }),
      source: (d) => d[0]?.provenance.source ?? events.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
