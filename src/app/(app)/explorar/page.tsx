import { BedDouble, CloudSun, Compass, Languages, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';

const ITEMS = [
  { href: '/hospedagens', icon: BedDouble, title: 'Hospedagens', text: 'Albergues, pousadas, hotéis e casas rurais perto da rota.' },
  { href: '/comer', icon: UtensilsCrossed, title: 'Cafés e restaurantes', text: 'Menu do peregrino, opções veganas e onde encher a garrafa.' },
  { href: '/cultura', icon: Compass, title: 'Eventos e cultura', text: 'Festas, igrejas, museus e costumes de cada cidade.' },
  { href: '/clima', icon: CloudSun, title: 'Clima', text: 'Previsão por etapa e recomendações práticas.' },
  { href: '/tradutor', icon: Languages, title: 'Tradutor por voz', text: 'Fale e ouça a tradução. Frases essenciais offline.' },
];

export default function ExplorarPage() {
  return (
    <>
      <TopBar title="Explorar" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="flex h-full gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-primary">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon aria-hidden />
              </span>
              <span>
                <span className="block text-lg font-bold">{title}</span>
                <span className="text-sm text-muted">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
