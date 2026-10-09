import { AlertTriangle, Bath, Building2, Bus, Droplets, Eye, HeartPulse, Home, Pill, ShoppingBasket, Signpost, Tent, WifiOff, type LucideIcon } from 'lucide-react';
import type { WaypointKind } from '@/lib/domain/types';

export const WAYPOINT_ICON: Record<WaypointKind, LucideIcon> = {
  town: Building2,
  water: Droplets,
  toilet: Bath,
  pharmacy: Pill,
  health: HeartPulse,
  market: ShoppingBasket,
  shelter: Home,
  rest: Tent,
  danger: AlertTriangle,
  no_signal: WifiOff,
  detour: Signpost,
  transport: Bus,
  viewpoint: Eye,
};

export const WAYPOINT_COLOR: Record<WaypointKind, string> = {
  town: '#545d57',
  water: '#1f6fb2',
  toilet: '#5a6b7a',
  pharmacy: '#2f7d4a',
  health: '#b3261e',
  market: '#8a5a00',
  shelter: '#6d4c7d',
  rest: '#2f7d74',
  danger: '#b3261e',
  no_signal: '#7a4f00',
  detour: '#a8492a',
  transport: '#1f4e79',
  viewpoint: '#5b6b3a',
};

export function WaypointIcon({ kind, size = 18 }: { kind: WaypointKind; size?: number }) {
  const Icon = WAYPOINT_ICON[kind];
  return <Icon aria-hidden size={size} color={WAYPOINT_COLOR[kind]} />;
}
