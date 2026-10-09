'use client';
import { Crown, NotebookPen, Settings, ShieldCheck, Shirt, Star } from 'lucide-react';
import Link from 'next/link';
import { Avatar2D } from '@/components/avatar/Avatar2D';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getPlan } from '@/lib/billing/plans';
import { usePlan } from '@/hooks/usePlan';
import { useAppStore } from '@/store/useAppStore';

const ITEMS = [
  { href: '/peregrino', icon: Shirt, title: 'Meu peregrino 3D', text: 'Roupa, mochila, chapéu e acessórios.' },
  { href: '/diario', icon: NotebookPen, title: 'Diário e conquistas', text: 'Notas, fotos, carimbos e distintivos.' },
  { href: '/premium', icon: Crown, title: 'Plano e assinatura', text: 'Gratuito, Passe do Caminho ou Premium.' },
  { href: '/perfil', icon: Settings, title: 'Perfil, privacidade e configurações', text: 'Tema, acessibilidade, dados e conta.' },
  { href: '/seguranca', icon: ShieldCheck, title: 'Central de Segurança', text: 'SOS, contatos e check-in.' },
];

export default function EuPage() {
  const profile = useAppStore((s) => s.profile);
  const avatar = useAppStore((s) => s.avatar);
  const { plan } = usePlan();
  const favorites = useAppStore((s) => s.favorites);
  return (
    <>
      <TopBar title="Eu" />
      <Card className="flex items-center gap-4">
        <div className="rounded-2xl bg-surface-2"><Avatar2D config={avatar} size={88} /></div>
        <div>
          <p className="text-xl font-extrabold">{profile?.displayName}</p>
          <Badge tone={plan === 'free' ? 'neutral' : 'gold'} icon={plan === 'free' ? undefined : <Crown aria-hidden size={14} />}>{getPlan(plan).name}</Badge>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted"><Star aria-hidden size={14} />{favorites.length} favorito(s)</p>
        </div>
      </Card>
      <ul className="mt-4 flex flex-col gap-2">
        {ITEMS.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-primary">
              <Icon aria-hidden className="shrink-0 text-primary" />
              <span>
                <span className="block font-bold">{title}</span>
                <span className="text-sm text-muted">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/admin" className="mt-6 block text-center text-sm text-muted underline">Painel administrativo (demonstração)</Link>
    </>
  );
}
