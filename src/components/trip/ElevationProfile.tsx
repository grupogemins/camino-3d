import type { Route } from '@/lib/domain/types';

/** Perfil altimétrico simplificado entre dois km da rota (a partir das paradas; estimativa). */
export function ElevationProfile({ route, startKm, endKm, height = 120 }: { route: Route; startKm: number; endKm: number; height?: number }) {
  const pts = route.stops.filter((s) => s.km >= startKm && s.km <= endKm);
  if (pts.length < 2) return null;
  // adiciona ondulação estimada entre as paradas para representar o relevo
  const series: { km: number; ele: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    series.push({ km: pts[i].km, ele: pts[i].elevationM });
    const next = pts[i + 1];
    if (next) {
      const span = next.km - pts[i].km;
      for (let k = 1; k < 4; k++) {
        const t = k / 4;
        const wave = Math.sin(t * Math.PI) * route.attributes.maxSlopePct * span * 0.9;
        series.push({ km: pts[i].km + span * t, ele: pts[i].elevationM + (next.elevationM - pts[i].elevationM) * t + wave });
      }
    }
  }
  const w = 320;
  const maxE = Math.max(...series.map((p) => p.ele)) + 20;
  const minE = Math.max(0, Math.min(...series.map((p) => p.ele)) - 20);
  const x = (km: number) => ((km - startKm) / (endKm - startKm || 1)) * w;
  const y = (e: number) => height - 18 - ((e - minE) / (maxE - minE || 1)) * (height - 30);
  const line = series.map((p) => `${x(p.km).toFixed(1)},${y(p.ele).toFixed(1)}`).join(' ');
  const summary = `Perfil de altitude de ${Math.round(minE)} a ${Math.round(maxE)} metros entre os km ${startKm} e ${endKm}.`;
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label={summary}>
        <polygon points={`0,${height - 18} ${line} ${w},${height - 18}`} fill="var(--primary-soft)" />
        <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((p) => (
          <g key={p.id}>
            <circle cx={x(p.km)} cy={y(p.elevationM)} r="3.5" fill="var(--terracotta)" />
            <text x={Math.min(w - 4, Math.max(4, x(p.km)))} y={height - 4} fontSize="9" textAnchor="middle" fill="var(--ink-muted)">
              {p.name.split(' ')[0]}
            </text>
          </g>
        ))}
        <text x="4" y="12" fontSize="9" fill="var(--ink-muted)">{Math.round(maxE)} m</text>
      </svg>
      <figcaption className="text-xs text-muted">Perfil estimado a partir das altitudes das vilas (demonstração).</figcaption>
    </figure>
  );
}
