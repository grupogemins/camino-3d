import { NextResponse } from 'next/server';
import { providerStatus } from '@/providers/registry';

export async function GET() {
  return NextResponse.json({ ok: true, providers: providerStatus(), time: new Date().toISOString() });
}
