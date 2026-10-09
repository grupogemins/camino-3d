'use client';
import { FlaskConical, WifiOff } from 'lucide-react';
import { useOnline } from '@/hooks/useOnline';

export function DemoBanner() {
  const online = useOnline();
  return (
    <div className="flex flex-col">
      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 bg-warning-soft px-3 py-1.5 text-sm font-semibold text-warning">
          <WifiOff aria-hidden size={16} /> Sem conexão: usando dados salvos no aparelho
        </div>
      )}
      <div className="flex items-center justify-center gap-1.5 px-3 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        <FlaskConical aria-hidden size={12} />
        Demonstração · dados fictícios
      </div>
    </div>
  );
}
