'use client';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export function TopBar({ title, back, actions, subtitle }: { title: string; back?: string | boolean; actions?: ReactNode; subtitle?: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 bg-bg/85 px-4 pb-2 pt-3 backdrop-blur-md">
      {back && (
        <button
          type="button"
          onClick={() => (typeof back === 'string' ? router.push(back) : router.back())}
          className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-surface-2"
          aria-label="Voltar"
        >
          <ArrowLeft aria-hidden />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[1.6rem] leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
      <Link href="/seguranca" className="flex h-11 items-center gap-1 rounded-full border border-danger/30 bg-danger-soft px-3 text-sm font-bold text-danger" aria-label="Central de Segurança e SOS">
        <ShieldAlert aria-hidden size={20} />
        <span>SOS</span>
      </Link>
    </header>
  );
}
