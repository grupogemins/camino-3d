import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getProviders, MOCK_IDS } from '@/providers/registry';
import { mockTranslation } from '@/providers/mock';
import { badRequest, rateLimit } from '@/lib/server/http';

const Lang = z.enum(['pt', 'es', 'en', 'fr', 'de', 'it']);
const Body = z.object({ text: z.string().min(1).max(500), from: Lang, to: Lang });

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'translate', 30);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Envie { text, from, to }.');
  const { translation } = getProviders();
  // Não registramos o texto traduzido em logs (privacidade).
  try {
    const data = await translation.translate(parsed.data);
    return NextResponse.json({ data, meta: { provider: translation.id, isDemo: MOCK_IDS.has(translation.id) || data.method === 'demo', source: translation.id, fetchedAt: new Date().toISOString(), cached: false, fallback: false } });
  } catch {
    const data = await mockTranslation.translate(parsed.data);
    return NextResponse.json({ data, meta: { provider: mockTranslation.id, isDemo: true, source: 'demonstração', fetchedAt: new Date().toISOString(), cached: false, fallback: true, notice: 'Tradução automática indisponível: usando modo de demonstração.' } });
  }
}
