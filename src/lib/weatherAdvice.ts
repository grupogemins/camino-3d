import type { WeatherSnapshot } from '@/lib/domain/types';

export interface Advice {
  id: string;
  icon: 'droplet' | 'sun' | 'umbrella' | 'wind' | 'thermometer' | 'alert' | 'sunrise';
  text: string;
  priority: number;
}

/** Transforma a previsão em recomendações simples e acionáveis. */
export function weatherAdvice(w: Pick<WeatherSnapshot, 'current' | 'hourly' | 'alerts' | 'sunrise'>): Advice[] {
  const out: Advice[] = [];
  const maxTemp = Math.max(w.current.tempC, ...w.hourly.map((h) => h.tempC));
  const rainHour = w.hourly.find((h) => h.precipProb >= 50);
  for (const a of w.alerts) {
    out.push({ id: `alert-${a.id}`, icon: 'alert', text: `Alerta ${a.level === 'red' ? 'vermelho' : a.level === 'orange' ? 'laranja' : 'amarelo'}: ${a.title}. Reavalie a etapa.`, priority: 0 });
  }
  if (rainHour) {
    const hh = new Date(rainHour.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    out.push({ id: 'rain', icon: 'umbrella', text: `Leve capa de chuva: chance de ${rainHour.precipProb}% de chuva a partir das ${hh}.`, priority: 1 });
  }
  if (maxTemp >= 26) out.push({ id: 'heat', icon: 'droplet', text: `Calor de até ${Math.round(maxTemp)}°C: leve pelo menos 2 litros de água e comece cedo.`, priority: 1 });
  else out.push({ id: 'water', icon: 'droplet', text: 'Leve ao menos 1,5 litro de água e reabasteça nas fontes indicadas.', priority: 3 });
  if (w.current.uvIndex >= 6) out.push({ id: 'uv', icon: 'sun', text: `Índice UV ${w.current.uvIndex}: protetor solar, chapéu e óculos.`, priority: 2 });
  if (w.current.windKmh >= 35) out.push({ id: 'wind', icon: 'wind', text: `Vento de ${w.current.windKmh} km/h: corta-vento e atenção em trechos expostos.`, priority: 2 });
  if (w.current.feelsLikeC <= 6) out.push({ id: 'cold', icon: 'thermometer', text: `Sensação térmica de ${w.current.feelsLikeC}°C: use camadas e proteja as mãos.`, priority: 2 });
  out.push({ id: 'sunrise', icon: 'sunrise', text: `Nascer do sol às ${w.sunrise}. Evite caminhar no escuro em estradas.`, priority: 4 });
  return out.sort((a, b) => a.priority - b.priority);
}
