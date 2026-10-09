'use client';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PremiumHint } from '@/components/places/PremiumGate';
import { LoadingState } from '@/components/ui/States';
import { useCopilot } from '@/hooks/useCopilot';
import { usePlan } from '@/hooks/usePlan';
import { FREE_LIMITS } from '@/lib/billing/plans';
import { SuggestionCard } from './SuggestionCard';

/** Bloco "Copiloto do dia". No gratuito mostra uma sugestão; o Camino Pass libera todas. */
export function CopilotPanel({ max = 3, showAllLink = true }: { max?: number; showAllLink?: boolean }) {
  const { suggestions, loading, segment } = useCopilot();
  const { can } = usePlan();
  const full = can('copilot_full');
  if (!segment) return null;
  const limit = full ? max : FREE_LIMITS.copilotSuggestionsPerDay;
  const shown = suggestions.slice(0, limit);
  const locked = suggestions.length - shown.length;
  return (
    <section aria-labelledby="copiloto" className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 id="copiloto" className="flex items-center gap-2 text-xl font-extrabold">
          <Sparkles aria-hidden className="text-gold" size={20} /> Copiloto do dia
        </h2>
        {showAllLink && suggestions.length > 0 && <Link href="/copiloto" className="text-sm font-bold text-primary">Ver tudo</Link>}
      </div>
      {loading && suggestions.length === 0 && <LoadingState label="Analisando sua etapa" />}
      {!loading && suggestions.length === 0 && <p className="text-muted">Nada fora do comum para a etapa de hoje. Bom Caminho!</p>}
      {shown.map((s) => <SuggestionCard key={s.id} s={s} />)}
      {locked > 0 && (full ? (
        <Link href="/copiloto" className="text-sm font-bold text-primary">Mais {locked} sugestão(ões)</Link>
      ) : (
        <PremiumHint>Mais {locked} sugestão(ões) para hoje no Camino Pass: chuva, ritmo, lotação, água e relatos da comunidade.</PremiumHint>
      ))}
    </section>
  );
}
