import { NextResponse, type NextRequest } from 'next/server';
import { getProviders, runProvider } from '@/providers/registry';
import { mockRouting } from '@/providers/mock';
import { rateLimit, serverError } from '@/lib/server/http';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'routes', 30);
  if (limited) return limited;
  const { routing } = getProviders();
  try {
    const result = await runProvider({
      cacheKey: `routes:${routing.id}`,
      ttlMs: 6 * 3_600_000,
      timeoutMs: 15000,
      providerId: routing.id,
      call: () => routing.listRoutes(),
      fallback: { providerId: mockRouting.id, call: () => mockRouting.listRoutes() },
      source: (d) => d[0]?.source ?? routing.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
