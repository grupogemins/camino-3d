'use client';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import type { Map as MLMap, GeoJSONSource } from 'maplibre-gl';
import { bbox } from '@/lib/geo/geo';
import type { MapData } from './types';

export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

function toGeoJSON(data: MapData) {
  return {
    route: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: data.routeLine } },
    active: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: data.activeLine ?? [] } },
    markers: {
      type: 'FeatureCollection',
      features: data.markers.map((m) => ({ type: 'Feature', properties: { id: m.id, label: m.label, color: m.color, kind: m.kind, glyph: m.glyph ?? '', href: m.href ?? '' }, geometry: { type: 'Point', coordinates: m.coord } })),
    },
    user: {
      type: 'FeatureCollection',
      features: data.user ? [{ type: 'Feature', properties: { off: data.user.offRoute }, geometry: { type: 'Point', coordinates: data.user.coord } }] : [],
    },
  } as const;
}

/** Mapa 2D/3D com MapLibre GL + OpenFreeMap (dados © OpenStreetMap). Carregado só no cliente. */
export function MapLibreView({ data, pitch3d, height = 420, onError, onNavigate }: { data: MapData; pitch3d: boolean; height?: number; onError: () => void; onNavigate?: (href: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let cancelled = false;
    let map: MLMap | null = null;
    (async () => {
      const maplibre = await import('maplibre-gl');
      maplibre.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs');
      if (cancelled || !ref.current) return;
      try {
        map = new maplibre.Map({
          container: ref.current,
          style: MAP_STYLE_URL,
          bounds: bbox(dataRef.current.focus.length ? dataRef.current.focus : dataRef.current.routeLine) as [[number, number], [number, number]],
          fitBoundsOptions: { padding: 40 },
          attributionControl: { compact: true },
          cooperativeGestures: false,
        });
      } catch {
        onError();
        return;
      }
      if (!map) return;
      mapRef.current = map;
      const m = map;
      // reserva: se o mapa não carregar em 12 s, usar o esquemático
      const timeout = setTimeout(() => {
        if (!m.loaded()) onError();
      }, 12000);
      m.on('load', () => clearTimeout(timeout));
      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'top-right');
      map.on('error', (e) => {
        // falha de estilo/tiles: volta para o mapa esquemático
        if (!map?.isStyleLoaded() && String(e.error?.message ?? '').length) onError();
      });
      map.on('load', () => {
        if (!map) return;
        const g = toGeoJSON(dataRef.current);
        map.addSource('route', { type: 'geojson', data: g.route as GeoJSON.Feature });
        map.addSource('active', { type: 'geojson', data: g.active as GeoJSON.Feature });
        map.addSource('markers', { type: 'geojson', data: g.markers as GeoJSON.FeatureCollection });
        map.addSource('user', { type: 'geojson', data: g.user as GeoJSON.FeatureCollection });
        map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#545d57', 'line-width': 4, 'line-dasharray': [1, 2] } });
        map.addLayer({ id: 'active', type: 'line', source: 'active', paint: { 'line-color': '#2f5d3a', 'line-width': 7 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
        map.addLayer({ id: 'markers', type: 'circle', source: 'markers', paint: { 'circle-radius': ['case', ['==', ['get', 'kind'], 'stop'], 6, 9], 'circle-color': ['case', ['==', ['get', 'kind'], 'stop'], '#ffffff', ['get', 'color']], 'circle-stroke-color': ['case', ['==', ['get', 'kind'], 'stop'], '#1c2420', '#ffffff'], 'circle-stroke-width': 2 } });
        map.addLayer({ id: 'marker-labels', type: 'symbol', source: 'markers', filter: ['==', ['get', 'kind'], 'stop'], layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-font': ['Noto Sans Bold'] }, paint: { 'text-color': '#1c2420', 'text-halo-color': '#ffffff', 'text-halo-width': 2 } });
        map.addLayer({ id: 'user', type: 'circle', source: 'user', paint: { 'circle-radius': 9, 'circle-color': ['case', ['get', 'off'], '#b3261e', '#1f4e79'], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });
        const popup = new maplibre.Popup({ closeButton: true, closeOnClick: true });
        map.on('click', 'markers', (e) => {
          const f = e.features?.[0];
          if (!f || !map) return;
          const p = f.properties as { label: string; href: string };
          const el = document.createElement('div');
          el.style.font = '14px sans-serif';
          el.textContent = p.label;
          if (p.href) {
            const a = document.createElement('button');
            a.textContent = 'Ver detalhes';
            a.style.cssText = 'display:block;margin-top:6px;font-weight:700;color:#2f5d3a;text-decoration:underline';
            a.onclick = () => onNavigate?.(p.href);
            el.appendChild(a);
          }
          popup.setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number]).setDOMContent(el).addTo(map);
        });
        map.on('mouseenter', 'markers', () => map && (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', 'markers', () => map && (map.getCanvas().style.cursor = ''));
      });
    })().catch(() => onError());
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza dados sem recriar o mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource('route')) return;
    const g = toGeoJSON(data);
    (map.getSource('route') as GeoJSONSource).setData(g.route as GeoJSON.Feature);
    (map.getSource('active') as GeoJSONSource).setData(g.active as GeoJSON.Feature);
    (map.getSource('markers') as GeoJSONSource).setData(g.markers as GeoJSON.FeatureCollection);
    (map.getSource('user') as GeoJSONSource).setData(g.user as GeoJSON.FeatureCollection);
  }, [data]);

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: pitch3d ? 60 : 0, bearing: pitch3d ? -20 : 0, duration: 800 });
  }, [pitch3d]);

  const focusKey = JSON.stringify(data.focus.slice(0, 1).concat(data.focus.slice(-1)));
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data.focus.length) return;
    map.fitBounds(bbox(data.focus) as [[number, number], [number, number]], { padding: 40, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return <div ref={ref} style={{ height }} className="overflow-hidden rounded-2xl border border-line" role="region" aria-label="Mapa interativo da rota" />;
}
