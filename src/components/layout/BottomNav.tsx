'use client';
import { clsx } from 'clsx';
import { Compass, Home, Map, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/inicio', label: 'Início', icon: Home, match: ['/inicio', '/planejar', '/rotas', '/etapas', '/seguranca'] },
  { href: '/mapa', label: 'Mapa', icon: Map, match: ['/mapa'] },
  { href: '/explorar', label: 'Explorar', icon: Compass, match: ['/explorar', '/hospedagens', '/comer', '/cultura', '/clima', '/tradutor'] },
  { href: '/comunidade', label: 'Comunidade', icon: Users, match: ['/comunidade'] },
  { href: '/eu', label: 'Eu', icon: User, match: ['/eu', '/peregrino', '/diario', '/premium', '/perfil'] },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-[1.75rem] border border-line/80 bg-surface/90 shadow-[0_12px_32px_-12px_rgb(40_30_10/0.45)] backdrop-blur-md md:sticky md:inset-x-auto md:top-0 md:bottom-auto md:h-dvh md:w-60 md:rounded-none md:border-y-0 md:border-l-0 md:shadow-none">
      <ul className="mx-auto flex max-w-xl justify-around px-1 py-1 md:mt-24 md:flex-col md:gap-1 md:px-3">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => path?.startsWith(m));
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={clsx('relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[1.4rem] text-[11px] font-bold md:min-h-12 md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base', active ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink')}
              >
                <Icon aria-hidden size={22} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
