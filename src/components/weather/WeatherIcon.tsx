import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, CloudDrizzle, Sun, Wind } from 'lucide-react';
import type { WeatherCondition } from '@/lib/domain/types';
import { WEATHER_LABEL } from '@/lib/labels';

const ICONS = { clear: Sun, partly_cloudy: CloudSun, cloudy: Cloud, rain: CloudRain, showers: CloudDrizzle, storm: CloudLightning, fog: CloudFog, wind: Wind };

export function WeatherIcon({ condition, size = 28 }: { condition: WeatherCondition; size?: number }) {
  const Icon = ICONS[condition];
  return <Icon size={size} role="img" aria-label={WEATHER_LABEL[condition]} />;
}
