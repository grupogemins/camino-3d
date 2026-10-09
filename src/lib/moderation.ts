/** Regras simples de moderação no cliente (o servidor deve repetir a verificação). */
const BLOCKED = ['idiota', 'imbecil', 'estúpido', 'puta', 'caralho', 'fuck', 'bitch', 'gilipollas', 'cabrón'];
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/;

export interface ModerationResult {
  ok: boolean;
  reason?: 'abusive' | 'link' | 'phone' | 'too_long' | 'repeated' | 'empty';
  message?: string;
}

export function moderateMessage(body: string, recent: string[] = []): ModerationResult {
  const text = body.trim();
  if (!text) return { ok: false, reason: 'empty', message: 'Escreva uma mensagem.' };
  if (text.length > 600) return { ok: false, reason: 'too_long', message: 'Mensagem muito longa (máx. 600 caracteres).' };
  const lower = text.toLowerCase();
  if (BLOCKED.some((w) => lower.includes(w))) return { ok: false, reason: 'abusive', message: 'Sua mensagem tem termos ofensivos e não foi enviada.' };
  if (URL_RE.test(text)) return { ok: false, reason: 'link', message: 'Links não são permitidos no primeiro contato (proteção contra spam).' };
  if (PHONE_RE.test(text)) return { ok: false, reason: 'phone', message: 'Por segurança, não compartilhe telefone no chat. Combine em locais públicos.' };
  if (recent.filter((r) => r.trim().toLowerCase() === lower).length >= 2) return { ok: false, reason: 'repeated', message: 'Mensagem repetida.' };
  return { ok: true };
}
