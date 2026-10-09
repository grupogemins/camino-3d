import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { SlidingWindowLimiter } from './rateLimit';

const limiters = new Map<string, SlidingWindowLimiter>();

function limiter(name: string, limit: number, windowMs: number) {
  let l = limiters.get(name);
  if (!l) {
    l = new SlidingWindowLimiter(limit, windowMs);
    limiters.set(name, l);
  }
  return l;
}

export function clientKey(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

/** Retorna uma resposta 429 se o cliente exceder o limite; senão null. */
export function rateLimit(req: NextRequest, name: string, limit = 60, windowMs = 60_000) {
  const r = limiter(name, limit, windowMs).check(clientKey(req));
  if (r.allowed) return null;
  return NextResponse.json(
    { error: { code: 'rate_limited', message: 'Muitas requisições. Tente novamente em instantes.' } },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(r.retryAfterMs / 1000)) } },
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: { code: 'bad_request', message } }, { status: 400 });
}

export function notFound(message = 'Não encontrado') {
  return NextResponse.json({ error: { code: 'not_found', message } }, { status: 404 });
}

export function serverError(err: unknown) {
  console.error('[api]', err);
  return NextResponse.json({ error: { code: 'provider_error', message: 'Serviço temporariamente indisponível.' } }, { status: 503 });
}
