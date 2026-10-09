import type { LngLat } from '@/lib/domain/types';

export interface MapMarker {
  id: string;
  coord: LngLat;
  kind: 'stop' | 'waypoint' | 'place' | 'pilgrim';
  label: string;
  color: string;
  /** Letra/emoji curto exibido no marcador (acessível via label). */
  glyph?: string;
  href?: string;
}

export interface MapData {
  routeLine: LngLat[];
  activeLine?: LngLat[];
  markers: MapMarker[];
  user?: { coord: LngLat; offRoute: boolean } | null;
  /** Área a enquadrar. */
  focus: LngLat[];
}
