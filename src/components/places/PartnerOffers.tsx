'use client';
import { BadgeCheck, Ticket } from 'lucide-react';
import Link from 'next/link';
import type { PartnerOffer } from '@/lib/domain/types';

interface WithOffer {
  id: string;
  name: string;
  town: string;
  partnerOffer?: PartnerOffer;
}

/**
 * Ofertas de parceiros fundadores: seção própria, marcada como publicidade,
 * visualmente separada da lista orgânica (que não muda por pagamento).
 */
export function PartnerOffers({ places, basePath }: { places: WithOffer[]; basePath?: string }) {
  const withOffer = places.filter((p) => p.partnerOffer && new Date(p.partnerOffer.validUntil).getTime() > Date.now());
  if (!withOffer.length) return null;
  return (
    <section aria-labelledby="ofertas" className="rounded-2xl border-2 border-dashed border-blue bg-blue-soft p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="ofertas" className="font-bold">Ofertas de parceiros</h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-blue">Publicidade</span>
      </div>
      <p className="text-xs text-muted">Parceiros fundadores pagam por este espaço. A lista abaixo segue só a relevância.</p>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {withOffer.map((p) => (
          <li key={p.id} className="min-w-[15rem] max-w-[17rem] shrink-0">
            <Wrap href={basePath ? `${basePath}/${p.id}` : undefined}>
              <span className="flex items-center gap-1 text-sm font-bold"><BadgeCheck aria-hidden size={16} className="text-blue" /> {p.name}</span>
              <span className="text-xs text-muted">{p.town} · parceiro verificado</span>
              <span className="text-sm">{p.partnerOffer!.title}</span>
              <span className="mt-auto flex items-center gap-1 text-xs font-semibold"><Ticket aria-hidden size={14} /> Cupom {p.partnerOffer!.couponCode}</span>
            </Wrap>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Wrap({ href, children }: { href?: string; children: React.ReactNode }) {
  const cls = 'flex h-full flex-col gap-1 rounded-xl bg-surface p-3';
  return href ? <Link href={href} className={cls}>{children}</Link> : <div className={cls}>{children}</div>;
}
