/** Guarda o código de indicação (?ref=CODIGO) por 30 dias para atribuir a venda ao afiliado. */
const KEY = 'camino-ref';
const TTL_MS = 30 * 86_400_000;

export function captureReferral(search: string): void {
  try {
    const code = new URLSearchParams(search).get('ref');
    if (code && /^[A-Za-z0-9-]{3,32}$/.test(code)) localStorage.setItem(KEY, JSON.stringify({ code: code.toUpperCase(), at: Date.now() }));
  } catch {
    /* storage indisponível */
  }
}

export function storedReferral(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code: string; at: number };
    return Date.now() - at < TTL_MS ? code : null;
  } catch {
    return null;
  }
}
