'use client';
import { CloudDownload, Crown, Crosshair, LocateFixed, Pause, Play, Shuffle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExploreViewer } from '@/components/avatar/Lazy3D';
import { WAYPOINT_COLOR } from '@/components/common/WaypointIcon';
import { TopBar } from '@/components/layout/TopBar';
import { NavigationPanel } from '@/components/map/NavigationPanel';
import { RouteMap } from '@/components/map/RouteMap';
import type { MapData, MapMarker } from '@/components/map/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ChipGroup, Segmented, SelectField } from '@/components/ui/Controls';
import { DemoBadge } from '@/components/ui/DataSource';
import { EmptyState, Notice } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import { track } from '@/lib/analytics/events';
import type { Accommodation, LngLat, Restaurant, WaypointKind } from '@/lib/domain/types';
import { formatDateTime } from '@/lib/format';
import { haversineKm } from '@/lib/geo/geo';
import { WAYPOINT_LABEL } from '@/lib/labels';
import { computeNavState, coordAtRouteKm, stageInstructions } from '@/lib/navigation';
import { downloadForOffline } from '@/lib/offline';
import { useAppStore } from '@/store/useAppStore';

type View = '2d' | 'schematic' | '3d';
type Filter = WaypointKind | 'lodging' | 'food';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'water', label: 'Água' },
  { id: 'pharmacy', label: 'Farmácia' },
  { id: 'health', label: 'Saúde' },
  { id: 'toilet', label: 'Banheiro' },
  { id: 'market', label: 'Mercado' },
  { id: 'shelter', label: 'Abrigo' },
  { id: 'rest', label: 'Descanso' },
  { id: 'transport', label: 'Transporte' },
  { id: 'danger', label: 'Atenção' },
  { id: 'no_signal', label: 'Sem sinal' },
  { id: 'detour', label: 'Desvios' },
  { id: 'lodging', label: 'Hospedagem' },
  { id: 'food', label: 'Comida' },
];
const GLYPH: Partial<Record<Filter, string>> = { water: 'A', pharmacy: '+', health: 'H', toilet: 'WC', market: 'M', transport: 'B', danger: '!', no_signal: '×', detour: '↪', shelter: '⌂', rest: 'D', lodging: 'Z', food: 'C', viewpoint: '◎' };

export function MapScreen() {
  const params = useSearchParams();
  const { trip, route, currentSegment } = useTripContext();
  const avatar = useAppStore((s) => s.avatar);
  const fitness = useAppStore((s) => s.profile?.fitness ?? 'intermediate');
  const consentLocation = useAppStore((s) => s.privacy.consentLocation);
  const simulatedKm = useAppStore((s) => s.simulatedKm);
  const setSimulatedKm = useAppStore((s) => s.setSimulatedKm);
  const markOffline = useAppStore((s) => s.markOfflineDownloaded);
  const { can } = usePlan();

  const [segmentId, setSegmentId] = useState(params.get('etapa') ?? currentSegment?.id ?? '');
  const segment = trip?.segments.find((s) => s.id === segmentId) ?? currentSegment;
  const [view, setView] = useState<View>('2d');
  const [pitch3d, setPitch3d] = useState(false);
  const [filters, setFilters] = useState<Filter[]>(['water', 'pharmacy', 'danger', 'no_signal', 'transport']);
  const [navigating, setNavigating] = useState(params.get('navegar') === '1');
  const [playing, setPlaying] = useState(false);
  const [detour, setDetour] = useState(0);
  const [gps, setGps] = useState<{ coord: LngLat; accuracy: number } | null>(null);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [offlineMsg, setOfflineMsg] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const startedTracked = useRef(false);

  // Km simulado restrito à etapa
  const km = segment ? Math.min(segment.endKm, Math.max(segment.startKm, simulatedKm)) : 0;
  useEffect(() => {
    if (segment && (simulatedKm < segment.startKm || simulatedKm > segment.endKm)) setSimulatedKm(segment.startKm);
  }, [segment, simulatedKm, setSimulatedKm]);

  useEffect(() => {
    if (!playing || !segment) return;
    const id = setInterval(() => {
      const cur = useAppStore.getState().simulatedKm;
      const next = Math.min(segment.endKm, cur + 0.25);
      setSimulatedKm(next);
      if (next >= segment.endKm) setPlaying(false);
    }, 600);
    return () => clearInterval(id);
  }, [playing, segment, setSimulatedKm]);

  useEffect(() => {
    if (navigating && !startedTracked.current) {
      startedTracked.current = true;
      track('navigation_started', { routeId: route.id });
    }
  }, [navigating, route.id]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const simulatedCoord = useMemo<LngLat>(() => {
    const c = coordAtRouteKm(route, km);
    return [c[0] + detour, c[1]];
  }, [route, km, detour]);

  const gpsNearRoute = gps && segment ? haversineKm(gps.coord, coordAtRouteKm(route, segment.startKm)) < 60 : false;
  const position = gps && gpsNearRoute ? gps.coord : simulatedCoord;
  const nav = segment ? computeNavState(route, segment, position, fitness) : null;
  const instructions = useMemo(() => (segment ? stageInstructions(route, segment) : []), [route, segment]);

  const stopIds = segment ? route.stops.filter((s) => s.km >= segment.startKm && s.km <= segment.endKm).map((s) => s.id) : [];
  const wantLodging = filters.includes('lodging');
  const wantFood = filters.includes('food');
  const acc = useApi<Accommodation[]>(wantLodging && stopIds.length ? `/api/places/accommodations?stopIds=${stopIds.join(',')}` : null);
  const food = useApi<Restaurant[]>(wantFood && stopIds.length ? `/api/places/restaurants?stopIds=${stopIds.join(',')}` : null);

  const data: MapData | null = useMemo(() => {
    if (!segment) return null;
    const stops = route.stops.filter((s) => s.km >= segment.startKm - 0.01 && s.km <= segment.endKm + 0.01);
    const markers: MapMarker[] = [
      ...route.stops.map((s) => ({ id: `stop-${s.id}`, coord: s.coord, kind: 'stop' as const, label: s.name, color: '#fff' })),
      ...route.waypoints
        .filter((w) => filters.includes(w.kind))
        .map((w) => ({ id: w.id, coord: w.coord, kind: 'waypoint' as const, label: `${WAYPOINT_LABEL[w.kind]}: ${w.name}`, color: WAYPOINT_COLOR[w.kind], glyph: GLYPH[w.kind] })),
      ...(wantLodging && acc.data ? acc.data.map((a) => ({ id: a.id, coord: a.coord, kind: 'place' as const, label: `${a.name} (demo)`, color: '#6d4c7d', glyph: 'Z', href: `/hospedagens/${a.id}` })) : []),
      ...(wantFood && food.data ? food.data.map((r) => ({ id: r.id, coord: r.coord, kind: 'place' as const, label: `${r.name} (demo)`, color: '#a8492a', glyph: 'C', href: `/comer?parada=${r.stopId}` })) : []),
    ];
    const startC = coordAtRouteKm(route, segment.startKm);
    const endC = coordAtRouteKm(route, segment.endKm);
    const activeLine: LngLat[] = [startC];
    for (let k = segment.startKm + 0.5; k < segment.endKm; k += 0.5) activeLine.push(coordAtRouteKm(route, k));
    activeLine.push(endC);
    return {
      routeLine: route.geometry,
      activeLine,
      markers,
      user: navigating ? { coord: position, offRoute: nav?.offRoute ?? false } : null,
      focus: [...stops.map((s) => s.coord), startC, endC],
    };
  }, [route, segment, filters, wantLodging, wantFood, acc.data, food.data, navigating, position, nav?.offRoute]);

  function startGps() {
    if (!consentLocation) {
      setGpsMsg('Ative "Usar minha localização" em Perfil > Privacidade para usar o GPS.');
      return;
    }
    if (!('geolocation' in navigator)) return setGpsMsg('Este aparelho não oferece geolocalização.');
    setGpsMsg('Obtendo sua posição…');
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const c: LngLat = [p.coords.longitude, p.coords.latitude];
        setGps({ coord: c, accuracy: p.coords.accuracy });
        setGpsMsg(segment && haversineKm(c, coordAtRouteKm(route, segment.startKm)) >= 60 ? 'Você está longe desta etapa: a navegação continua em modo simulado.' : `GPS ativo (precisão ~${Math.round(p.coords.accuracy)} m). Sua posição não é compartilhada.`);
      },
      () => setGpsMsg('Não foi possível obter a posição. Continuando em modo simulado.'),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  }

  async function downloadOffline() {
    if (!trip) return;
    setOfflineMsg('Baixando rota, etapas e frases…');
    const ok = await downloadForOffline(trip.segments.map((s) => s.id), route.stops.map((s) => ({ id: s.id, coord: s.coord, name: s.name })));
    if (ok) markOffline();
    setOfflineMsg(ok ? 'Rota disponível offline neste aparelho (mapa esquemático, etapas, clima salvo e frases).' : 'Não foi possível baixar agora. Tente com conexão.');
  }

  if (!trip || !segment || !data || !nav) {
    return (
      <>
        <TopBar title="Mapa" />
        <EmptyState title="Nenhuma rota ativa" description="Planeje uma viagem para ver as etapas no mapa." action={<ButtonLink href="/planejar">Planejar</ButtonLink>} />
      </>
    );
  }

  const weatherMood = 'clear' as const;
  return (
    <>
      <TopBar title="Mapa" subtitle={`${route.shortName} · Dia ${segment.day}: ${segment.fromName} → ${segment.toName}`} actions={<DemoBadge compact />} />
      <div className="flex flex-col gap-3">
        <SelectField label="Etapa" value={segment.id} onChange={(e) => setSegmentId(e.target.value)}>
          {trip.segments.map((s) => (
            <option key={s.id} value={s.id}>
              Dia {s.day}: {s.fromName} → {s.toName} ({s.distanceKm} km)
            </option>
          ))}
        </SelectField>
        <Segmented
          label="Visualização"
          hideLabel
          value={view}
          onChange={setView}
          options={[
            { id: '2d', label: 'Mapa 2D' },
            { id: 'schematic', label: 'Esquemático' },
            { id: '3d', label: 'Exploração 3D' },
          ]}
        />

        {view === '3d' ? (
          <div className="h-[420px] overflow-hidden rounded-2xl border border-line">
            <ExploreViewer config={avatar} region={route.stops.find((s) => s.id === segment.toStopId)?.region ?? 'minho'} weather={weatherMood} action={navigating && playing ? 'walk' : nav.arrived ? 'celebrate' : navigating ? 'idle' : 'walk'} progress={navigating ? nav.stageProgress : undefined} />
          </div>
        ) : (
          <RouteMap data={data} pitch3d={pitch3d} preferSchematic={view === 'schematic'} />
        )}
        {view === '3d' && <p className="text-xs text-muted">Cena estilizada inspirada na região (não é uma reprodução fiel). Para se orientar, use o mapa 2D.</p>}
        {view === '2d' && (
          <Button variant="outline" onClick={() => setPitch3d((v) => !v)} aria-pressed={pitch3d}>
            {pitch3d ? 'Voltar à vista de cima' : 'Inclinar mapa (relevo e prédios)'}
          </Button>
        )}

        {!navigating ? (
          <Button size="lg" block onClick={() => setNavigating(true)} icon={<Play aria-hidden />}>
            Iniciar navegação
          </Button>
        ) : (
          <>
            <NavigationPanel nav={nav} instructions={instructions} />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setPlaying((p) => !p)} icon={playing ? <Pause aria-hidden /> : <Play aria-hidden />} variant={playing ? 'secondary' : 'primary'}>
                {playing ? 'Pausar simulação' : 'Simular caminhada'}
              </Button>
              <Button variant="outline" onClick={() => setDetour((d) => (d ? 0 : 0.004))} icon={<Shuffle aria-hidden />} aria-pressed={detour !== 0}>
                {detour ? 'Voltar à rota' : 'Simular desvio'}
              </Button>
              <Button variant="outline" onClick={startGps} icon={<Crosshair aria-hidden />}>
                Usar meu GPS
              </Button>
              <Button variant="outline" onClick={() => setSimulatedKm(segment.startKm)} icon={<LocateFixed aria-hidden />}>
                Reiniciar etapa
              </Button>
            </div>
            {gpsMsg && <Notice tone="info">{gpsMsg}</Notice>}
            <p className="text-xs text-muted">Posição simulada para demonstração enquanto o GPS não está ativo. A navegação não substitui a sinalização no terreno.</p>
          </>
        )}

        <ChipGroup label="Mostrar no mapa" options={FILTERS} value={filters} onChange={setFilters} />

        <section aria-labelledby="offline-title" className="rounded-2xl border border-line bg-surface p-4">
          <h2 id="offline-title" className="font-bold">
            Usar sem sinal
          </h2>
          {trip.offlineDownloadedAt && <p className="text-sm text-primary">Baixado em {formatDateTime(trip.offlineDownloadedAt)}.</p>}
          {can('offline_maps') ? (
            <Button className="mt-2" block variant="secondary" onClick={downloadOffline} icon={<CloudDownload aria-hidden />}>
              {trip.offlineDownloadedAt ? 'Atualizar dados offline' : 'Baixar rota para uso offline'}
            </Button>
          ) : (
            <ButtonLink className="mt-2" href="/premium" block variant="secondary" icon={<Crown aria-hidden size={18} />}>
              Mapas offline no Premium
            </ButtonLink>
          )}
          {offlineMsg && <p className="mt-2 text-sm" role="status">{offlineMsg}</p>}
          <p className="mt-1 text-xs text-muted">Neste MVP o modo offline usa o mapa esquemático. Tiles detalhados offline (PMTiles) estão no roadmap.</p>
        </section>
      </div>
    </>
  );
}
