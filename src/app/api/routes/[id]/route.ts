import { NextResponse, type NextRequest } from 'next/server';
import { getProviders, runProvider } from '@/providers/registry';
import { mockRouting } from '@/providers/mock';
import { notFound, rateLimit, serverError } from '@/lib/server/http';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(req, 'routes', 30);
  if (limited) return limited;
  const { id } = await ctx.params;
  const { routing } = getProviders();
  try {
    const result = await runProvider({
      cacheKey: `route:${routing.id}:${id}`,
      ttlMs: 6 * 3_600_000,
      providerId: routing.id,
      call: () => routing.getRoute(id),
      fallback: { providerId: mockRouting.id, call: () => mockRouting.getRoute(id) },
      source: (d) => d?.source ?? routing.id,
    });
    if (!result.data) return notFound('Rota não encontrada');
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
