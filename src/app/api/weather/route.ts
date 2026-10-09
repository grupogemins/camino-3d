import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getProviders, runProvider } from '@/providers/registry';
import { mockWeather } from '@/providers/mock';
import { badRequest, rateLimit, serverError } from '@/lib/server/http';

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  name: z.string().max(80).default('Local'),
});

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'weather', 60);
  if (limited) return limited;
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest('Parâmetros lat, lng obrigatórios.');
  const { lat, lng, name } = parsed.data;
  const { weather } = getProviders();
  try {
    // Arredonda para ~1 km: melhora o cache e evita guardar a posição exata.
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const result = await runProvider({
      cacheKey: `weather:${weather.id}:${key}`,
      ttlMs: 30 * 60_000,
      providerId: weather.id,
      call: () => weather.getForecast([Number(lng.toFixed(2)), Number(lat.toFixed(2))], name),
      fallback: { providerId: mockWeather.id, call: () => mockWeather.getForecast([lng, lat], name) },
      source: (d) => d.source,
    });
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
