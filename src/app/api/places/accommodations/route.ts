import { NextResponse, type NextRequest } from 'next/server';
import { getProviders, runProvider } from '@/providers/registry';
import { mockPlaces } from '@/providers/mock';
import { badRequest, rateLimit, serverError } from '@/lib/server/http';
import { PlaceQuerySchema } from '../query';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'places', 90);
  if (limited) return limited;
  const parsed = PlaceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest('Parâmetros inválidos.');
  const { places } = getProviders();
  try {
    const result = await runProvider({
      cacheKey: `accommodations:${places.id}:${req.nextUrl.search}`,
      ttlMs: 15 * 60_000,
      providerId: places.id,
      call: () => places.listAccommodations(parsed.data),
      fallback: { providerId: mockPlaces.id, call: () => mockPlaces.listAccommodations(parsed.data) },
      source: (d) => d[0]?.provenance.source ?? places.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
