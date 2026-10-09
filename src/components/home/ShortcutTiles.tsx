import { BedDouble, Compass, CloudSun, Languages, NotebookPen, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

const TILES = [
  { href: '/hospedagens', label: 'Dormir', hint: 'Albergues e pousadas', icon: BedDouble, bg: 'bg-[#2c5235]' },
  { href: '/comer', label: 'Comer', hint: 'Menu do peregrino', icon: UtensilsCrossed, bg: 'bg-[#a4492a]' },
  { href: '/clima', label: 'Clima', hint: 'Por etapa', icon: CloudSun, bg: 'bg-[#1e4f8c]' },
  { href: '/tradutor', label: 'Tradutor', hint: 'Por voz', icon: Languages, bg: 'bg-[#6b4a7a]' },
  { href: '/cultura', label: 'Cultura', hint: 'Festas e igrejas', icon: Compass, bg: 'bg-[#8a6a2a]' },
  { href: '/diario', label: 'Diário', hint: 'Suas memórias', icon: NotebookPen, bg: 'bg-[#4b5a52]' },
];

/** Atalhos em blocos coloridos com textura de mapa. */
export function ShortcutTiles() {
  return (
    <nav aria-label="Atalhos">
      <ul className="grid grid-cols-3 gap-2.5">
        {TILES.map(({ href, label, hint, icon: Icon, bg }) => (
          <li key={href}>
            <Link href={href} className={`topo group flex aspect-[1/1.05] flex-col justify-between rounded-[1.25rem] ${bg} p-3 text-white shadow-[var(--shadow-card)] transition-transform active:scale-[0.97]`}>
              <Icon aria-hidden size={22} strokeWidth={1.8} className="opacity-90" />
              <span>
                <span className="block font-display text-lg leading-none">{label}</span>
                <span className="mt-1 block text-[11px] leading-tight text-white/75">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
