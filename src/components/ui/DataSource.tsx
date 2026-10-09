import { FlaskConical, Info, Megaphone } from 'lucide-react';
import { formatDateTime, freshnessLabel } from '@/lib/format';
import { Badge } from './Badge';

/** Selo obrigatório sempre que o dado for fictício. */
export function DemoBadge({ compact }: { compact?: boolean }) {
  return (
    <Badge tone="gold" icon={<FlaskConical aria-hidden size={14} />} className="whitespace-nowrap">
      {compact ? 'Demo' : 'Dados de demonstração'}
      {compact && <span className="sr-only"> (dados de demonstração)</span>}
    </Badge>
  );
}

export function SponsoredBadge() {
  return (
    <Badge tone="blue" icon={<Megaphone aria-hidden size={14} />}>
      Patrocinado
    </Badge>
  );
}

/** Linha de procedência: fonte, horário da última atualização e aviso de dado antigo. */
export function SourceLine({ source, fetchedAt, isDemo, estimate, className }: { source: string; fetchedAt: string; isDemo: boolean; estimate?: boolean; className?: string }) {
  const fresh = freshnessLabel(fetchedAt);
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted ${className ?? ''}`}>
      <Info aria-hidden size={13} />
      <span>Fonte: {source}</span>
      <span aria-hidden>·</span>
      <span>
        Atualizado em <time dateTime={fetchedAt}>{formatDateTime(fetchedAt)}</time> ({fresh.label})
      </span>
      {estimate && <span className="font-semibold">· Valor estimado</span>}
      {fresh.stale && !isDemo && <span className="font-semibold text-warning">· Pode estar desatualizado</span>}
      {isDemo && <span className="font-semibold text-warning">· Fictício</span>}
    </p>
  );
}
