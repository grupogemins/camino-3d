/**
 * Camada de autenticação substituível.
 * - Modo demonstração (padrão): conta salva só neste aparelho; NENHUMA senha é armazenada.
 * - Supabase: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (chave pública com RLS)
 *   e implemente `supabaseAuth` com @supabase/supabase-js (ver docs/07-substituir-mocks.md).
 */
export interface AuthAdapter {
  id: 'demo' | 'supabase';
  signUp(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>;
  signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>;
  socialProviders: { id: 'google' | 'apple'; enabled: boolean }[];
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? null : 'Informe um e-mail válido.';
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Use pelo menos 8 caracteres.';
  if (!/[0-9]/.test(pw) || !/[a-zA-Z]/.test(pw)) return 'Use letras e números.';
  return null;
}

export const demoAuth: AuthAdapter = {
  id: 'demo',
  async signUp(email, password) {
    const e = validateEmail(email) ?? validatePassword(password);
    return e ? { ok: false, error: e } : { ok: true };
  },
  async signIn(email, password) {
    const e = validateEmail(email) ?? (password.length ? null : 'Informe a senha.');
    return e ? { ok: false, error: e } : { ok: true };
  },
  socialProviders: [
    { id: 'google', enabled: false },
    { id: 'apple', enabled: false },
  ],
};

export function getAuth(): AuthAdapter {
  // Quando o Supabase estiver configurado, retornar o adaptador real aqui.
  return demoAuth;
}
