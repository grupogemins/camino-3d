'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOnline } from '@/hooks/useOnline';
import { useWebGL } from '@/hooks/useWebGL';
import { SchematicMap } from './SchematicMap';
import type { MapData } from './types';

const MapLibreView = dynamic(() => import('./MapLibreView').then((m) => m.MapLibreView), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-2xl" role="status" aria-label="Carregando mapa" />,
});

/**
 * Escolhe o renderizador: MapLibre (online + WebGL) ou mapa esquemático (offline, sem WebGL ou falha de tiles).
 * O usuário também pode forçar o esquemático (mais leve e legível).
 */
export function RouteMap({ data, pitch3d, preferSchematic, height = 420 }: { data: MapData; pitch3d: boolean; preferSchematic?: boolean; height?: number }) {
  const online = useOnline();
  const webgl = useWebGL();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const useSchematic = preferSchematic || !online || webgl === false || failed;
  if (webgl === null) return <div className="skeleton rounded-2xl" style={{ height }} />;
  return (
    <div>
      {useSchematic ? (
        <SchematicMap data={data} height={height} />
      ) : (
        <div style={{ height }}>
          <MapLibreView data={data} pitch3d={pitch3d} height={height} onError={() => setFailed(true)} onNavigate={(href) => router.push(href)} />
        </div>
      )}
      {(failed || !online || webgl === false) && !preferSchematic && (
        <p className="mt-1 text-xs font-semibold text-warning" role="status">
          {failed ? 'Não foi possível carregar o mapa detalhado. ' : !online ? 'Sem conexão. ' : 'Seu aparelho não suporta mapa acelerado. '}
          Mostrando o mapa esquemático.
        </p>
      )}
      {!useSchematic && <p className="mt-1 text-[11px] text-muted">Mapa © OpenStreetMap contributors · estilo OpenFreeMap · traçado simplificado de demonstração</p>}
    </div>
  );
}
