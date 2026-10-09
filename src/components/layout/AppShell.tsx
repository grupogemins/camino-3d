'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { useAppStore } from '@/store/useAppStore';
import { BottomNav } from './BottomNav';
import { DemoBanner } from './DemoBanner';
import { LoadingState } from '@/components/ui/States';

/** Casca das telas autenticadas: navegação inferior (celular) ou lateral (desktop) e guarda de sessão. */
export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const user = useAppStore((s) => s.user);
  const onboardingDone = useAppStore((s) => s.onboardingDone);
  const router = useRouter();
  const path = usePathname();
  // A Central de Segurança fica sempre acessível, mesmo sem conta.
  const publicPath = path?.startsWith('/seguranca');

  useEffect(() => {
    if (!hydrated || publicPath) return;
    if (!user) router.replace('/entrar');
    else if (!onboardingDone) router.replace('/onboarding');
  }, [hydrated, user, onboardingDone, router, publicPath]);

  const ready = hydrated && (publicPath || (user && onboardingDone));

  return (
    <div className="md:flex">
      <BottomNav />
      <div className="min-w-0 flex-1">
        <DemoBanner />
        <main id="conteudo" className="mx-auto w-full max-w-3xl px-4 pb-28 md:pb-10">
          {ready ? children : <div className="pt-6"><LoadingState label="Abrindo o Camino 3D…" /></div>}
        </main>
      </div>
    </div>
  );
}
