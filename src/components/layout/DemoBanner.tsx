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
      <div className="flex items-center justify-center gap-2 bg-gold-soft px-3 py-1 text-xs font-semibold text-warning">
        <FlaskConical aria-hidden size={14} />
        MVP com dados de demonstração: preços, avaliações, clima, eventos e peregrinos são fictícios.
      </div>
    </div>
  );
}
