import { ChevronRight, Clock, Mountain, Route as RouteIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import type { RouteSegment } from '@/lib/domain/types';
import { formatHours, formatKm } from '@/lib/format';
import { DIFFICULTY_LABEL } from '@/lib/labels';

const tone = { easy: 'green', moderate: 'gold', hard: 'terracotta' } as const;

export function StageSummary({ segment, done, date }: { segment: RouteSegment; done?: boolean; date?: string }) {
  return (
    <Link href={`/etapas/${segment.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-primary">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${done ? 'bg-primary text-on-primary' : 'bg-surface-2'}`} aria-hidden>
        {segment.day}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-bold">
          <span className="sr-only">Dia {segment.day}: </span>
          {segment.fromName} → {segment.toName}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1"><RouteIcon aria-hidden size={14} />{formatKm(segment.distanceKm)}</span>
          <span className="inline-flex items-center gap-1"><Clock aria-hidden size={14} />{formatHours(segment.estimatedHours)}</span>
          <span className="inline-flex items-center gap-1"><Mountain aria-hidden size={14} />+{segment.ascentM} m</span>
          {date && <span>{date}</span>}
        </p>
      </div>
      <Badge tone={tone[segment.difficulty]}>{DIFFICULTY_LABEL[segment.difficulty]}</Badge>
      {done && <span className="sr-only">(concluída)</span>}
      <ChevronRight aria-hidden className="text-muted" />
    </Link>
  );
}
