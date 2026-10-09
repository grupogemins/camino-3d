'use client';
import { Heart, Star } from 'lucide-react';
import type { PriceSnapshot, ReviewSummary } from '@/lib/domain/types';
import { formatEur } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export function Rating({ review }: { review?: ReviewSummary }) {
  if (!review) return <span className="text-sm text-muted">Sem avaliações</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star aria-hidden size={15} className="fill-[var(--gold)] text-gold" />
      <b>{review.rating.toFixed(1)}</b>
      <span className="text-muted">({review.count.toLocaleString('pt-BR')} avaliações{review.isDemo ? ', fictícias' : ''})</span>
    </span>
  );
}

export function Price({ price, suffix }: { price: PriceSnapshot; suffix: string }) {
  if (price.amount === 0) return <span className="font-bold">Donativo</span>;
  return (
    <span>
      <b className="text-lg">{formatEur(price.amount)}</b>
      <span className="text-sm text-muted"> {suffix}</span>
      {price.isEstimate && <span className="text-xs text-muted"> · estimativa</span>}
    </span>
  );
}

export function FavoriteButton({ id, name }: { id: string; name: string }) {
  const fav = useAppStore((s) => s.favorites.includes(id));
  const toggle = useAppStore((s) => s.toggleFavorite);
  return (
    <button type="button" onClick={() => toggle(id)} aria-pressed={fav} aria-label={fav ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2">
      <Heart aria-hidden className={fav ? 'fill-[var(--terracotta)] text-terracotta' : 'text-muted'} />
    </button>
  );
}
