/** Gerador de CLIMA DE DEMONSTRAÇÃO: determinístico por local e dia, plausível para o noroeste ibérico. */
import type { LngLat, WeatherCondition, WeatherSnapshot } from '@/lib/domain/types';
import { between, hashString, seeded } from './seed';

// Médias aproximadas por mês (min, max, chance de chuva base) para o litoral norte de Portugal/Galiza.
const MONTHLY: [number, number, number][] = [
  [5, 13, 60], [5, 14, 55], [7, 16, 50], [8, 17, 50], [11, 20, 40], [14, 23, 25],
  [15, 25, 15], [15, 25, 15], [14, 23, 30], [11, 19, 50], [8, 15, 60], [6, 13, 65],
];
const SUN: [string, string][] = [
  ['08:57', '18:15'], ['08:35', '18:50'], ['07:55', '19:25'], ['08:05', '21:00'], ['07:20', '21:35'], ['07:00', '22:00'],
  ['07:15', '22:00'], ['07:45', '21:30'], ['08:15', '20:40'], ['08:30', '19:45'], ['08:15', '18:00'], ['08:45', '17:55'],
];

function conditionFor(precip: number, rnd: () => number): WeatherCondition {
  if (precip >= 75) return rnd() > 0.85 ? 'storm' : 'rain';
  if (precip >= 50) return 'showers';
  if (precip >= 30) return 'cloudy';
  if (precip >= 15) return 'partly_cloudy';
  return rnd() > 0.9 ? 'fog' : 'clear';
}

export function demoWeather(coord: LngLat, locationName: string, now = new Date()): WeatherSnapshot {
  const day = now.toISOString().slice(0, 10);
  const rnd = seeded(hashString(`${day}-${coord[0].toFixed(2)}-${coord[1].toFixed(2)}`));
  const month = now.getUTCMonth();
  const [minBase, maxBase, rainBase] = MONTHLY[month];
  const inland = coord[0] > -8.7 ? 1 : 0;

  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + i * 86_400_000);
    const minC = Math.round(minBase - inland + between(rnd, -2, 2));
    const maxC = Math.round(maxBase + inland + between(rnd, -3, 3));
    const precipProb = Math.max(0, Math.min(100, Math.round(rainBase + between(rnd, -30, 35))));
    return { date: d.toISOString().slice(0, 10), minC, maxC, precipProb, condition: conditionFor(precipProb, rnd) };
  });

  const today = daily[0];
  const startHour = new Date(now);
  startHour.setUTCMinutes(0, 0, 0);
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const t = new Date(startHour.getTime() + i * 3_600_000);
    const localHour = (t.getUTCHours() + 2) % 24;
    const curve = Math.sin(((localHour - 8) / 24) * 2 * Math.PI);
    const tempC = Math.round(today.minC + ((today.maxC - today.minC) * (curve + 1)) / 2);
    const precipProb = Math.max(0, Math.min(100, Math.round(today.precipProb + between(rnd, -20, 20) + (localHour > 14 ? 10 : 0))));
    return { time: t.toISOString(), tempC, precipProb, condition: conditionFor(precipProb, rnd) };
  });

  const current = hourly[0];
  const windKmh = Math.round(between(rnd, 6, 28) + (coord[0] < -8.75 ? 10 : 0));
  const alerts = today.precipProb >= 80
    ? [{ id: `al-${day}`, level: 'yellow' as const, title: 'Chuva persistente (demonstração)', description: 'Acumulados elevados previstos à tarde. Exemplo fictício de alerta.', issuer: 'Alerta simulado (fonte oficial: MeteoAlarm / AEMET / IPMA)', validUntil: new Date(now.getTime() + 12 * 3_600_000).toISOString() }]
    : [];

  return {
    locationName,
    coord,
    current: {
      tempC: current.tempC,
      feelsLikeC: Math.round(current.tempC - windKmh / 12),
      condition: current.condition,
      precipProb: current.precipProb,
      windKmh,
      uvIndex: Math.max(1, Math.round((today.maxC - 8) / 3 - today.precipProb / 40)),
    },
    sunrise: SUN[month][0],
    sunset: SUN[month][1],
    hourly,
    daily,
    alerts,
    source: 'Clima de demonstração (gerado; não é previsão real)',
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 60_000).toISOString(),
    isDemo: true,
  };
}
