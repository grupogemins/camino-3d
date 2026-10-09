/**
 * Provedor REAL de clima: Open-Meteo (sem chave para uso não comercial).
 * Uso comercial exige plano pago da Open-Meteo: ver docs/07-substituir-mocks.md.
 * Alertas oficiais não são fornecidos pela Open-Meteo: integrar MeteoAlarm/AEMET/IPMA.
 */
import type { WeatherCondition, WeatherSnapshot } from '@/lib/domain/types';
import type { WeatherProvider } from '../types';

function mapCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 95) return 'storm';
  if (code >= 80) return 'showers';
  if (code >= 51) return 'rain';
  return 'cloudy';
}

interface OpenMeteoResponse {
  current: { temperature_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number; precipitation_probability?: number; uv_index?: number };
  hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[] };
  daily: { time: string[]; temperature_2m_min: number[]; temperature_2m_max: number[]; precipitation_probability_max: number[]; weather_code: number[]; sunrise: string[]; sunset: string[]; uv_index_max: number[] };
}

export function createOpenMeteoProvider(baseUrl = process.env.OPEN_METEO_BASE_URL ?? 'https://api.open-meteo.com'): WeatherProvider {
  return {
    id: 'open-meteo',
    async getForecast(coord, locationName): Promise<WeatherSnapshot> {
      const params = new URLSearchParams({
        latitude: String(coord[1]),
        longitude: String(coord[0]),
        current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability,uv_index',
        hourly: 'temperature_2m,precipitation_probability,weather_code',
        daily: 'temperature_2m_min,temperature_2m_max,precipitation_probability_max,weather_code,sunrise,sunset,uv_index_max',
        timezone: 'Europe/Madrid',
        forecast_days: '7',
        forecast_hours: '24',
      });
      if (process.env.OPEN_METEO_API_KEY) params.set('apikey', process.env.OPEN_METEO_API_KEY);
      const res = await fetch(`${baseUrl}/v1/forecast?${params}`, { headers: { 'User-Agent': 'Camino3D/0.1' } });
      if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
      const j = (await res.json()) as OpenMeteoResponse;
      const now = new Date();
      const hhmm = (iso: string) => iso.slice(11, 16);
      return {
        locationName,
        coord,
        current: {
          tempC: Math.round(j.current.temperature_2m),
          feelsLikeC: Math.round(j.current.apparent_temperature),
          condition: mapCode(j.current.weather_code),
          precipProb: j.current.precipitation_probability ?? j.hourly.precipitation_probability[0] ?? 0,
          windKmh: Math.round(j.current.wind_speed_10m),
          uvIndex: Math.round(j.current.uv_index ?? j.daily.uv_index_max[0] ?? 0),
        },
        sunrise: hhmm(j.daily.sunrise[0]),
        sunset: hhmm(j.daily.sunset[0]),
        hourly: j.hourly.time.map((t, i) => ({
          time: new Date(`${t}:00+02:00`).toISOString(),
          tempC: Math.round(j.hourly.temperature_2m[i]),
          precipProb: j.hourly.precipitation_probability[i] ?? 0,
          condition: mapCode(j.hourly.weather_code[i]),
        })),
        daily: j.daily.time.map((d, i) => ({
          date: d,
          minC: Math.round(j.daily.temperature_2m_min[i]),
          maxC: Math.round(j.daily.temperature_2m_max[i]),
          precipProb: j.daily.precipitation_probability_max[i] ?? 0,
          condition: mapCode(j.daily.weather_code[i]),
        })),
        alerts: [],
        source: 'Open-Meteo.com (CC BY 4.0)',
        sourceUrl: 'https://open-meteo.com/',
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 30 * 60_000).toISOString(),
        isDemo: false,
      };
    },
  };
}
