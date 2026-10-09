import { ArrowUpRight, BedDouble, CloudSun, Compass, Languages, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';

const ITEMS = [
  { href: '/hospedagens', icon: BedDouble, title: 'Hospedagens', text: 'Albergues, pousadas, hotéis e casas rurais perto da rota.', bg: 'bg-[#2c5235]', big: true },
  { href: '/comer', icon: UtensilsCrossed, title: 'Comer', text: 'Menu do peregrino, opções veganas e água.', bg: 'bg-[#a4492a]' },
  { href: '/cultura', icon: Compass, title: 'Cultura', text: 'Festas, igrejas, museus e costumes.', bg: 'bg-[#8a6a2a]' },
  { href: '/clima', icon: CloudSun, title: 'Clima', text: 'Previsão por etapa e o que levar.', bg: 'bg-[#1e4f8c]' },
  { href: '/tradutor', icon: Languages, title: 'Tradutor', text: 'Fale e ouça. Frases offline.', bg: 'bg-[#6b4a7a]' },
];

export default function ExplorarPage() {
  return (
    <>
      <TopBar title="Explorar" subtitle="O que há ao longo da sua etapa" />
      <ul className="grid grid-cols-2 gap-3">
        {ITEMS.map(({ href, icon: Icon, title, text, bg, big }) => (
          <li key={href} className={big ? 'col-span-2' : ''}>
            <Link href={href} className={`topo relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] ${bg} p-4 text-white shadow-[var(--shadow-card)] transition-transform active:scale-[0.98] ${big ? 'min-h-48' : 'min-h-44'}`}>
              <span className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <Icon aria-hidden size={22} strokeWidth={1.8} />
                </span>
                <ArrowUpRight aria-hidden size={20} className="opacity-70" />
              </span>
              <span>
                <span className={`block font-display leading-none ${big ? 'text-[2rem]' : 'text-[1.45rem]'}`}>{title}</span>
                <span className="mt-1.5 block text-sm leading-snug text-white/80">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
