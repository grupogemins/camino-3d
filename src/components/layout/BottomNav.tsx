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
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:top-0 md:h-dvh md:w-60 md:border-r md:border-t-0 md:pb-0">
      <ul className="mx-auto flex max-w-xl justify-around md:mt-24 md:flex-col md:gap-1 md:px-3">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => path?.startsWith(m));
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={clsx('flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold md:min-h-12 md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base', active ? 'text-primary md:bg-primary-soft' : 'text-muted hover:text-ink')}
              >
                <Icon aria-hidden size={24} strokeWidth={active ? 2.6 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
