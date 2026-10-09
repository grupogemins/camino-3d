import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { SplashHero } from '@/components/brand/SplashHero';
import { ButtonLink } from '@/components/ui/Button';

const FEATURES = [
  { title: 'Etapas sob medida', text: 'Planeje até Santiago no seu ritmo, compare caminhos e navegue mesmo sem sinal.' },
  { title: 'Um copiloto para cada dia', text: 'Clima, subidas, água e lotação viram decisões simples, com o porquê de cada sugestão.' },
  { title: 'Seu peregrino em 3D', text: 'Ele avança com você, ganha um broche em cada cidade e vira cartões para compartilhar.' },
  { title: 'Caminho ao vivo', text: 'Quem está na sua etapa, idiomas e condições do trecho, sem expor a sua posição.' },
  { title: 'Segurança sempre à mão', text: 'SOS com confirmação, 112 e check-in com contatos de confiança.' },
];

export default function SplashPage() {
  return (
    <main id="conteudo" className="mx-auto min-h-dvh max-w-xl">
      <section className="relative h-[78dvh] min-h-[560px] overflow-hidden sm:mt-4 sm:rounded-[2rem]">
        <SplashHero />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#140f0a] via-[#140f0a]/70 to-transparent" />
        <div className="absolute inset-x-5 top-5 flex items-center justify-between text-white">
          <Logo inverted />
          <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm">Demonstração</span>
        </div>
        <div className="absolute inset-x-5 bottom-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">Caminho de Santiago</p>
          <h1 className="mt-2 text-[2.6rem] leading-[1.02]">
            Sua peregrinação, <em className="font-display italic text-[var(--gold)]">viva</em>, do primeiro passo a Santiago.
          </h1>
          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href="/entrar?modo=cadastro" size="lg" block icon={<ArrowRight aria-hidden />} className="!bg-[var(--gold)] !text-ink">
              Começar meu Caminho
            </ButtonLink>
            <ButtonLink href="/entrar" variant="outline" size="lg" block className="!border-white/40 !bg-white/10 !text-white backdrop-blur-sm">
              Já tenho conta
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="px-5 pb-12 pt-10">
        <h2 className="text-[1.7rem] leading-tight">Tudo o que o Caminho pede, num só lugar.</h2>
        <ol className="mt-6 flex flex-col gap-5">
          {FEATURES.map(({ title, text }, i) => (
            <li key={title} className="flex gap-4">
              <span aria-hidden className="font-display text-[2rem] leading-none text-terracotta">{String(i + 1).padStart(2, '0')}</span>
              <div className="border-b border-line pb-5">
                <p className="font-display text-xl">{title}</p>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-xs text-muted">
          Versão de demonstração com dados fictícios. O Camino 3D não substitui a sinalização oficial nem os serviços de emergência (112).
        </p>
      </section>
    </main>
  );
}
