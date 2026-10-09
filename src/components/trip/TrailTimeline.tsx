import { Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { RouteSegment } from '@/lib/domain/types';
import { formatHours, formatKm } from '@/lib/format';
import { DIFFICULTY_LABEL } from '@/lib/labels';

const DOT = { easy: 'bg-[#6e9c4a]', moderate: 'bg-[var(--gold)]', hard: 'bg-terracotta' } as const;

/** Etapas como uma trilha: linha tracejada, carimbos numerados e a etapa atual destacada. */
export function TrailTimeline({ segments, doneIds, currentId, dateFor }: { segments: RouteSegment[]; doneIds: string[]; currentId?: string; dateFor: (s: RouteSegment) => string }) {
  return (
    <ol className="relative">
      <span aria-hidden className="trail-line absolute bottom-6 left-[1.35rem] top-6 w-[3px]" />
      {segments.map((s) => {
        const done = doneIds.includes(s.id);
        const current = s.id === currentId;
        return (
          <li key={s.id} className="relative">
            <Link href={`/etapas/${s.id}`} className={`group flex items-center gap-3 rounded-2xl py-2.5 pr-2 ${current ? 'my-1 bg-surface shadow-[var(--shadow-card)]' : 'hover:bg-surface/60'}`}>
              <span
                aria-hidden
                className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold ${
                  done ? 'bg-primary text-on-primary' : current ? 'bg-[var(--gold)] text-ink ring-4 ring-[var(--gold-soft)]' : 'border-2 border-dashed border-ink/25 bg-bg text-ink/70'
                }`}
              >
                {done ? <Check size={20} strokeWidth={3} /> : s.day}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[1.08rem] leading-snug">
                  <span className="sr-only">Dia {s.day}: </span>
                  {s.fromName} <span className="text-muted">→</span> {s.toName}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
                  <span>{formatKm(s.distanceKm)}</span>
                  <span aria-hidden>·</span>
                  <span>{formatHours(s.estimatedHours)}</span>
                  <span aria-hidden>·</span>
                  <span>+{s.ascentM} m</span>
                  <span aria-hidden>·</span>
                  <span>{dateFor(s)}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[s.difficulty]}`} />
                    {DIFFICULTY_LABEL[s.difficulty]}
                  </span>
                </p>
              </div>
              {done && <span className="sr-only">(concluída)</span>}
              <ChevronRight aria-hidden size={18} className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
