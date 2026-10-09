/** Principais nacionalidades de peregrinos (lista curta para o MVP). */
export const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'IT', name: 'Itália' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'FR', name: 'França' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'KR', name: 'Coreia do Sul' },
  { code: 'JP', name: 'Japão' },
  { code: 'CA', name: 'Canadá' },
  { code: 'AU', name: 'Austrália' },
  { code: 'NL', name: 'Países Baixos' },
  { code: 'PL', name: 'Polônia' },
  { code: 'XX', name: 'Outro' },
];

export function flag(code: string) {
  if (code.length !== 2 || code === 'XX') return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}
