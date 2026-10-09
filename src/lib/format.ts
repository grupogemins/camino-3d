export function formatDateTime(iso: string, locale = 'pt-BR') {
  return new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
}

export function formatDate(iso: string, locale = 'pt-BR') {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

export function formatEur(amount: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
}

export function formatKm(km: number) {
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export function formatHours(h: number) {
  const hours = Math.floor(h);
  const min = Math.round((h - hours) * 60);
  return min ? `${hours}h${String(min).padStart(2, '0')}` : `${hours}h`;
}

/** Idade do dado em linguagem simples. */
export function freshnessLabel(fetchedAt: string, now = new Date()): { label: string; stale: boolean } {
  const ageMin = Math.max(0, (now.getTime() - new Date(fetchedAt).getTime()) / 60_000);
  const stale = ageMin > 60 * 24;
  if (ageMin < 60) return { label: `há ${Math.round(ageMin)} min`, stale };
  if (ageMin < 60 * 24) return { label: `há ${Math.round(ageMin / 60)} h`, stale };
  return { label: `há ${Math.round(ageMin / 1440)} dia(s)`, stale };
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
