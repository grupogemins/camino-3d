import { ArrowRight, CloudSun, Languages, Map, ShieldCheck, Users } from 'lucide-react';
import { HeroIllustration } from '@/components/brand/HeroIllustration';
import { Logo } from '@/components/brand/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { DemoBadge } from '@/components/ui/DataSource';

const FEATURES = [
  { icon: Map, title: 'Rotas e etapas', text: 'Planeje até Santiago, compare caminhos e navegue mesmo sem sinal.' },
  { icon: CloudSun, title: 'Clima por etapa', text: 'Recomendações simples: água, protetor, capa de chuva.' },
  { icon: Languages, title: 'Tradutor por voz', text: 'Farmácia, albergue e emergência em qualquer idioma.' },
  { icon: Users, title: 'Comunidade', text: 'Conheça peregrinos com controle total da sua localização.' },
  { icon: ShieldCheck, title: 'Segurança', text: 'SOS com confirmação, 112 e check-in com contatos.' },
];

export default function SplashPage() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <Logo />
        <DemoBadge compact />
      </div>
      <div className="animate-rise mt-6 overflow-hidden rounded-[2rem] border border-line shadow-[var(--shadow-card)]">
        <HeroIllustration className="block h-auto w-full" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold leading-tight">
        Seu copiloto no <span className="text-primary">Caminho de Santiago</span>
      </h1>
      <p className="mt-2 text-lg text-muted">Rota, hospedagem, clima, cultura, tradução e comunidade num só lugar, com um peregrino 3D que caminha com você.</p>
      <div className="mt-6 flex flex-col gap-3">
        <ButtonLink href="/entrar?modo=cadastro" size="lg" block icon={<ArrowRight aria-hidden />}>
          Começar meu Caminho
        </ButtonLink>
        <ButtonLink href="/entrar" variant="outline" size="lg" block>
          Já tenho conta
        </ButtonLink>
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-surface p-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon aria-hidden />
            </span>
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-xs text-muted">
        Este MVP usa dados de demonstração. O Camino 3D não substitui a sinalização oficial nem os serviços de emergência (112).
      </p>
    </main>
  );
}
