import { Clock, Mountain, Navigation, Route as RouteIcon } from 'lucide-react';
import Link from 'next/link';
import type { RouteSegment } from '@/lib/domain/types';
import { formatHours, formatKm } from '@/lib/format';
import { DIFFICULTY_LABEL } from '@/lib/labels';

/** Cartão de destaque da etapa do dia (verde de bosque com curvas de nível). */
export function TodayStage({ segment, date }: { segment: RouteSegment; date: string }) {
  const stats = [
    { icon: RouteIcon, value: formatKm(segment.distanceKm), label: 'distância' },
    { icon: Clock, value: formatHours(segment.estimatedHours), label: 'caminhando' },
    { icon: Mountain, value: `+${segment.ascentM} m`, label: 'subida' },
  ];
  return (
    <article className="topo relative overflow-hidden rounded-[var(--radius-card)] bg-primary p-5 text-on-primary shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-80">
          Dia {segment.day} · {date}
        </p>
        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">{DIFFICULTY_LABEL[segment.difficulty]}</span>
      </div>
      <Link href={`/etapas/${segment.id}`} className="mt-1 block font-display text-[1.7rem] leading-tight hover:underline">
        <span className="sr-only">Dia {segment.day}: </span>
        {segment.fromName} <span className="text-[var(--gold)]">→</span> {segment.toName}
      </Link>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-2xl bg-black/15 px-3 py-2">
            <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider opacity-75">
              <Icon aria-hidden size={12} /> {label}
            </dt>
            <dd className="font-display text-xl">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Link href="/mapa?navegar=1" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--gold)] font-bold text-ink shadow-[0_6px_16px_-6px_rgb(0_0_0/0.5)]">
          <Navigation aria-hidden size={18} /> Navegar
        </Link>
        <Link href={`/etapas/${segment.id}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-5 font-bold">
          Detalhes
        </Link>
      </div>
    </article>
  );
}
