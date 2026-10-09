'use client';
import { ChevronRight, Crown, Film, Globe2, NotebookPen, Settings, ShieldCheck, Shirt, Star } from 'lucide-react';
import Link from 'next/link';
import { Avatar2D } from '@/components/avatar/Avatar2D';
import { TopBar } from '@/components/layout/TopBar';
import { useTripContext } from '@/hooks/useTripContext';
import { journeyStats } from '@/lib/journey';
import { getPlan } from '@/lib/billing/plans';
import { usePlan } from '@/hooks/usePlan';
import { useAppStore } from '@/store/useAppStore';

const ITEMS = [
  { href: '/jornada', icon: Globe2, title: 'Minha jornada 3D', text: 'Seu peregrino avançando pelo Caminho, com lembranças de cada cidade.' },
  { href: '/peregrino', icon: Shirt, title: 'Meu peregrino 3D', text: 'Roupa, mochila, chapéu e acessórios.' },
  { href: '/retrospectiva', icon: Film, title: 'Retrospectiva', text: 'Mapa, cidades, fotos e números da sua peregrinação.' },
  { href: '/diario', icon: NotebookPen, title: 'Diário e conquistas', text: 'Notas, fotos, carimbos e distintivos.' },
  { href: '/premium', icon: Crown, title: 'Camino Pass', text: 'Gratuito, Camino Pass ou pacote Grupo/Família.' },
  { href: '/perfil', icon: Settings, title: 'Perfil, privacidade e configurações', text: 'Tema, acessibilidade, dados e conta.' },
  { href: '/seguranca', icon: ShieldCheck, title: 'Central de Segurança', text: 'SOS, contatos e check-in.' },
];

export default function EuPage() {
  const profile = useAppStore((s) => s.profile);
  const avatar = useAppStore((s) => s.avatar);
  const { plan } = usePlan();
  const favorites = useAppStore((s) => s.favorites);
  const { trip, route } = useTripContext();
  const stats = trip ? journeyStats(trip) : null;
  return (
    <>
      <TopBar title="Eu" />
      {/* Credencial do peregrino: o "passaporte" com carimbos */}
      <section aria-label="Minha credencial" className="overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
        <div className="topo flex items-center justify-between bg-blue px-5 py-2.5 text-white">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Credencial do peregrino</span>
          <span className="rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-xs font-bold text-ink">{getPlan(plan).name}</span>
        </div>
        <div className="flex items-center gap-4 p-5">
          <div className="rounded-full bg-[var(--gold-soft)] ring-4 ring-surface-2">
            <Avatar2D config={avatar} size={84} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[1.7rem] leading-tight">{profile?.displayName}</p>
            <p className="text-sm text-muted">{trip ? route.name : 'Sem viagem planejada'}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <Star aria-hidden size={14} />
              {favorites.length} favorito(s)
            </p>
          </div>
        </div>
        {stats && (
          <dl className="grid grid-cols-3 border-t border-dashed border-line">
            {[
              ['km', stats.walkedKm.toLocaleString('pt-BR')],
              ['etapas', `${stats.stagesDone}/${stats.stagesTotal}`],
              ['carimbos', String(stats.stagesDone)],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-3 text-center [&:not(:first-child)]:border-l [&:not(:first-child)]:border-dashed [&:not(:first-child)]:border-line">
                <dd className="font-display text-2xl">{value}</dd>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        )}
      </section>
      <ul className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-surface shadow-[var(--shadow-card)]">
        {ITEMS.map(({ href, icon: Icon, title, text }) => (
          <li key={href} className="[&:not(:last-child)]:border-b [&:not(:last-child)]:border-line/70">
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon aria-hidden size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{title}</span>
                <span className="block truncate text-sm text-muted">{text}</span>
              </span>
              <ChevronRight aria-hidden size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/admin" className="mt-6 block text-center text-sm text-muted underline">Painel administrativo (demonstração)</Link>
    </>
  );
}
