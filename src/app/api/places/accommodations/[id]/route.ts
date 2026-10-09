import { NextResponse, type NextRequest } from 'next/server';
import { getProviders, runProvider } from '@/providers/registry';
import { mockPlaces } from '@/providers/mock';
import { notFound, rateLimit, serverError } from '@/lib/server/http';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(req, 'places', 90);
  if (limited) return limited;
  const { id } = await ctx.params;
  const { places } = getProviders();
  try {
    const result = await runProvider({
      cacheKey: `acc:${places.id}:${id}`,
      ttlMs: 15 * 60_000,
      providerId: places.id,
      call: () => places.getAccommodation(id),
      fallback: { providerId: mockPlaces.id, call: () => mockPlaces.getAccommodation(id) },
      source: (d) => d?.provenance.source ?? places.id,
    });
    if (!result.data) return notFound('Hospedagem não encontrada');
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
