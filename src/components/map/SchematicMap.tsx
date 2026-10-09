'use client';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { bbox } from '@/lib/geo/geo';
import type { LngLat } from '@/lib/domain/types';
import type { MapData } from './types';

/**
 * Mapa esquemático em SVG: funciona offline e sem WebGL.
 * Projeção equiretangular local; não substitui um mapa topográfico.
 */
export function SchematicMap({ data, height = 420 }: { data: MapData; height?: number }) {
  const [zoom, setZoom] = useState(1);
  const W = 400;
  const H = 400;
  const [[minX, minY], [maxX, maxY]] = useMemo(() => bbox(data.focus.length ? data.focus : data.routeLine), [data.focus, data.routeLine]);
  const midLat = (minY + maxY) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const spanX = Math.max(0.01, (maxX - minX) * kx);
  const spanY = Math.max(0.01, maxY - minY);
  const scale = (Math.min(W / spanX, H / spanY) * 0.82) * zoom;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const project = (p: LngLat): [number, number] => [W / 2 + (p[0] - cx) * kx * scale, H / 2 - (p[1] - cy) * scale];
  const path = (line: LngLat[]) => line.map((p, i) => `${i ? 'L' : 'M'}${project(p).map((n) => n.toFixed(1)).join(' ')}`).join(' ');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-[#e9efe2] dark:bg-[#1a221d]" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Mapa esquemático da rota com paradas e pontos de apoio">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <path d={path(data.routeLine)} fill="none" stroke="var(--ink-muted)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" />
        {data.activeLine && <path d={path(data.activeLine)} fill="none" stroke="var(--primary)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
        {data.markers.map((m) => {
          const [x, y] = project(m.coord);
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return null;
          const r = m.kind === 'stop' ? 6 : 9;
          const node = (
            <g key={m.id}>
              <title>{m.label}</title>
              <circle cx={x} cy={y} r={r} fill={m.kind === 'stop' ? 'var(--surface)' : m.color} stroke={m.kind === 'stop' ? 'var(--ink)' : 'white'} strokeWidth={2} />
              {m.glyph && (
                <text x={x} y={y + 3.5} fontSize="10" textAnchor="middle" fill="white" fontWeight="bold" aria-hidden>
                  {m.glyph}
                </text>
              )}
              {m.kind === 'stop' && (
                <text x={x + 9} y={y + 4} fontSize="11" fontWeight="bold" fill="var(--ink)" stroke="var(--bg)" strokeWidth={3} paintOrder="stroke">
                  {m.label}
                </text>
              )}
            </g>
          );
          return m.href ? (
            <Link key={m.id} href={m.href} aria-label={m.label}>
              {node}
            </Link>
          ) : (
            node
          );
        })}
        {data.user && (
          <g>
            <circle cx={project(data.user.coord)[0]} cy={project(data.user.coord)[1]} r={16} fill={data.user.offRoute ? 'var(--danger)' : 'var(--blue)'} opacity={0.2} />
            <circle cx={project(data.user.coord)[0]} cy={project(data.user.coord)[1]} r={8} fill={data.user.offRoute ? 'var(--danger)' : 'var(--blue)'} stroke="white" strokeWidth={3} />
            <title>Sua posição{data.user.offRoute ? ' (fora da rota)' : ''}</title>
          </g>
        )}
      </svg>
      <div className="absolute right-2 top-2 flex flex-col gap-2">
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow" onClick={() => setZoom((z) => Math.min(6, z * 1.5))} aria-label="Aproximar">
          <Plus aria-hidden />
        </button>
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow" onClick={() => setZoom((z) => Math.max(0.5, z / 1.5))} aria-label="Afastar">
          <Minus aria-hidden />
        </button>
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow" onClick={() => setZoom(1)} aria-label="Enquadrar etapa">
          <LocateFixed aria-hidden />
        </button>
      </div>
      <p className="absolute bottom-1 left-2 rounded bg-surface/80 px-1.5 text-[11px] text-muted">Mapa esquemático offline · traçado simplificado</p>
    </div>
  );
}
