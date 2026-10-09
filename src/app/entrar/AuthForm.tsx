'use client';
import { Info, LogIn, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Field, Segmented } from '@/components/ui/Controls';
import { Notice } from '@/components/ui/States';
import { track } from '@/lib/analytics/events';
import { getAuth } from '@/lib/auth/auth';
import { useAppStore } from '@/store/useAppStore';

export function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const auth = getAuth();
  const [mode, setMode] = useState<'cadastro' | 'login'>(params.get('modo') === 'cadastro' ? 'cadastro' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signUp = useAppStore((s) => s.signUp);
  const signIn = useAppStore((s) => s.signIn);

  useEffect(() => {
    if (mode === 'cadastro') track('signup_started');
  }, [mode]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'cadastro' && name.trim().length < 2) return setError('Informe como quer ser chamado(a).');
    setBusy(true);
    const r = mode === 'cadastro' ? await auth.signUp(email, password) : await auth.signIn(email, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (mode === 'cadastro') signUp(email, name.trim());
    else signIn(email);
    const s = useAppStore.getState();
    router.push(s.onboardingDone ? '/inicio' : '/onboarding');
  }

  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Logo />
      <h1 className="mt-8 text-2xl font-extrabold">{mode === 'cadastro' ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1>
      <p className="text-muted">Bom Caminho! Leva menos de 2 minutos.</p>
      <div className="mt-6">
        <Segmented
          label="Tipo de acesso"
          hideLabel
          value={mode}
          onChange={setMode}
          options={[
            { id: 'cadastro', label: 'Criar conta' },
            { id: 'login', label: 'Entrar' },
          ]}
        />
      </div>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {mode === 'cadastro' && <Field label="Como quer ser chamado(a)?" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} required />}
        <Field label="E-mail" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field
          label="Senha"
          type="password"
          autoComplete={mode === 'cadastro' ? 'new-password' : 'current-password'}
          hint={mode === 'cadastro' ? 'Mínimo de 8 caracteres, com letras e números.' : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <Notice tone="danger">{error}</Notice>}
        <Button type="submit" size="lg" block disabled={busy} icon={mode === 'cadastro' ? <UserPlus aria-hidden /> : <LogIn aria-hidden />}>
          {mode === 'cadastro' ? 'Criar conta' : 'Entrar'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-2">
        {auth.socialProviders.map((p) => (
          <Button key={p.id} variant="outline" block disabled={!p.enabled} aria-describedby="social-note">
            Continuar com {p.id === 'google' ? 'Google' : 'Apple'}
          </Button>
        ))}
        <p id="social-note" className="flex items-start gap-2 text-sm text-muted">
          <Info aria-hidden size={16} className="mt-0.5 shrink-0" />
          Login social ainda não está ativo: depende de credenciais OAuth que não foram configuradas neste MVP.
        </p>
      </div>
      {auth.id === 'demo' && (
        <div className="mt-6">
          <Notice tone="warning">Modo demonstração: sua conta fica salva só neste aparelho e nenhuma senha é armazenada.</Notice>
        </div>
      )}
    </main>
  );
}
