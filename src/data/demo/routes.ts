/**
 * DADOS DE DEMONSTRAÇÃO — Caminho Português (Porto → Santiago de Compostela).
 * Cidades, coordenadas e quilometragens aproximadas a partir de conhecimento público;
 * o traçado é SIMPLIFICADO (cidade a cidade) e não deve ser usado para navegação real.
 * Para produção: importar GPX oficial/licenciado ou OpenStreetMap (relações "Caminho Português").
 */
import type { LngLat, Route, RouteAlert, RouteStop, Waypoint, WaypointKind } from '@/lib/domain/types';
import { demoProvenance } from './provenance';

type StopInput = [id: string, name: string, lat: number, lng: number, km: number, elevationM: number, region: RouteStop['region'], services?: Partial<RouteStop['services']>];

const ALL_SERVICES = { lodging: true, food: true, pharmacy: true, transport: true };

function stops(list: StopInput[]): RouteStop[] {
  return list.map(([id, name, lat, lng, km, elevationM, region, services]) => ({
    id,
    name,
    coord: [lng, lat] as LngLat,
    km,
    elevationM,
    region,
    services: { ...ALL_SERVICES, ...services },
  }));
}

/**
 * Gera uma linha simplificada passando por todas as paradas, com 3 pontos intermediários
 * levemente curvados entre cada par (apenas estética). Paradas ficam nos índices i * 4.
 */
export const POINTS_PER_LEG = 4;
function buildGeometry(routeStops: RouteStop[], wiggle = 0.006): LngLat[] {
  const line: LngLat[] = [];
  routeStops.forEach((s, i) => {
    line.push(s.coord);
    const next = routeStops[i + 1];
    if (!next) return;
    for (let k = 1; k < POINTS_PER_LEG; k++) {
      const t = k / POINTS_PER_LEG;
      const offset = Math.sin(t * Math.PI) * wiggle * (i % 2 === 0 ? 1 : -1);
      line.push([
        s.coord[0] + (next.coord[0] - s.coord[0]) * t + offset,
        s.coord[1] + (next.coord[1] - s.coord[1]) * t,
      ]);
    }
  });
  return line;
}

/** Interpola a coordenada aproximada de um km da rota a partir das paradas. */
export function coordAtKm(routeStops: RouteStop[], km: number): LngLat {
  if (km <= routeStops[0].km) return routeStops[0].coord;
  for (let i = 1; i < routeStops.length; i++) {
    const a = routeStops[i - 1];
    const b = routeStops[i];
    if (km <= b.km) {
      const t = (km - a.km) / (b.km - a.km || 1);
      return [a.coord[0] + (b.coord[0] - a.coord[0]) * t, a.coord[1] + (b.coord[1] - a.coord[1]) * t];
    }
  }
  return routeStops[routeStops.length - 1].coord;
}

type WaypointInput = [kind: WaypointKind, name: string, km: number, note?: string];

function waypoints(routeId: string, routeStops: RouteStop[], list: WaypointInput[]): Waypoint[] {
  return list.map(([kind, name, km, note], i) => ({
    id: `${routeId}-wp-${i + 1}`,
    routeId,
    kind,
    name,
    km,
    coord: coordAtKm(routeStops, km),
    note,
    verifiedAt: kind === 'danger' || kind === 'detour' ? demoProvenance.fetchedAt : undefined,
  }));
}

// ---------------- Rota Central ----------------
const centralStops = stops([
  ['porto', 'Porto (Sé)', 41.1429, -8.611, 0, 80, 'porto'],
  ['vilarinho', 'Vilarinho', 41.3108, -8.638, 27, 90, 'minho'],
  ['rates', 'São Pedro de Rates', 41.4233, -8.663, 40, 110, 'minho', { pharmacy: false }],
  ['barcelos', 'Barcelos', 41.5388, -8.6151, 54, 40, 'minho'],
  ['vitorino', 'Vitorino dos Piães', 41.702, -8.61, 74, 120, 'minho', { pharmacy: false, transport: false }],
  ['pontedelima', 'Ponte de Lima', 41.7672, -8.5836, 87, 25, 'minho'],
  ['rubiaes', 'Rubiães', 41.8889, -8.5961, 105, 230, 'minho', { pharmacy: false }],
  ['tui', 'Tui', 42.0467, -8.6447, 125, 60, 'galicia_sul'],
  ['porrino', 'O Porriño', 42.1617, -8.6197, 141, 30, 'galicia_sul'],
  ['mos', 'Mos', 42.1955, -8.6, 147, 220, 'galicia_sul', { pharmacy: false }],
  ['redondela', 'Redondela', 42.2836, -8.6097, 157, 10, 'rias_baixas'],
  ['arcade', 'Arcade', 42.339, -8.612, 164, 15, 'rias_baixas'],
  ['pontevedra', 'Pontevedra', 42.431, -8.6444, 177, 20, 'rias_baixas'],
  ['briallos', 'Briallos', 42.526, -8.642, 190, 90, 'rias_baixas', { pharmacy: false }],
  ['caldas', 'Caldas de Reis', 42.6047, -8.6425, 199, 25, 'rias_baixas'],
  ['padron', 'Padrón', 42.7389, -8.6606, 218, 10, 'rias_baixas'],
  ['escravitude', 'A Escravitude', 42.779, -8.64, 225, 120, 'santiago', { pharmacy: false }],
  ['santiago', 'Santiago de Compostela', 42.8806, -8.5446, 243, 260, 'santiago'],
]);

// ---------------- Rota da Costa ----------------
const costaStops = stops([
  ['porto', 'Porto (Sé)', 41.1429, -8.611, 0, 80, 'porto'],
  ['matosinhos', 'Matosinhos', 41.1844, -8.6963, 10, 10, 'porto'],
  ['viladoconde', 'Vila do Conde', 41.3536, -8.7453, 33, 10, 'minho'],
  ['esposende', 'Esposende', 41.5328, -8.7811, 57, 10, 'minho'],
  ['viana', 'Viana do Castelo', 41.6932, -8.8329, 81, 15, 'minho'],
  ['ancora', 'Vila Praia de Âncora', 41.815, -8.862, 99, 10, 'minho'],
  ['caminha', 'Caminha', 41.8747, -8.8384, 108, 10, 'minho'],
  ['aguarda', 'A Guarda', 41.901, -8.8743, 113, 20, 'galicia_sul'],
  ['oia', 'Oia', 42.0003, -8.874, 127, 20, 'galicia_sul', { pharmacy: false }],
  ['baiona', 'Baiona', 42.118, -8.8496, 144, 10, 'galicia_sul'],
  ['vigo', 'Vigo', 42.2406, -8.7207, 169, 40, 'rias_baixas'],
  ['redondela', 'Redondela', 42.2836, -8.6097, 185, 10, 'rias_baixas'],
  ['arcade', 'Arcade', 42.339, -8.612, 192, 15, 'rias_baixas'],
  ['pontevedra', 'Pontevedra', 42.431, -8.6444, 205, 20, 'rias_baixas'],
  ['briallos', 'Briallos', 42.526, -8.642, 218, 90, 'rias_baixas', { pharmacy: false }],
  ['caldas', 'Caldas de Reis', 42.6047, -8.6425, 227, 25, 'rias_baixas'],
  ['padron', 'Padrón', 42.7389, -8.6606, 246, 10, 'rias_baixas'],
  ['escravitude', 'A Escravitude', 42.779, -8.64, 253, 120, 'santiago', { pharmacy: false }],
  ['santiago', 'Santiago de Compostela', 42.8806, -8.5446, 271, 260, 'santiago'],
]);

// ---------------- Variante Espiritual ----------------
const espiritualStops = stops([
  ...centralStops.slice(0, 13).map((s) => [s.id, s.name, s.coord[1], s.coord[0], s.km, s.elevationM, s.region, s.services] as StopInput),
  ['combarro', 'Combarro', 42.4316, -8.7063, 189, 10, 'rias_baixas'],
  ['armenteira', 'Armenteira', 42.46, -8.7458, 198, 300, 'rias_baixas', { pharmacy: false, transport: false }],
  ['vilanova', 'Vilanova de Arousa', 42.564, -8.827, 222, 10, 'rias_baixas'],
  ['padron', 'Padrón (chegada de barco)', 42.7389, -8.6606, 224, 10, 'rias_baixas'],
  ['escravitude', 'A Escravitude', 42.779, -8.64, 231, 120, 'santiago', { pharmacy: false }],
  ['santiago', 'Santiago de Compostela', 42.8806, -8.5446, 249, 260, 'santiago'],
]);

const alertsCommon: RouteAlert[] = [
  {
    id: 'alert-arrows',
    severity: 'info',
    title: 'Siga as setas amarelas e os marcos com a vieira',
    description: 'O traçado deste MVP é simplificado. No terreno, a sinalização oficial sempre prevalece.',
    verifiedAt: demoProvenance.fetchedAt,
  },
];

export const routes: Route[] = [
  {
    id: 'central',
    name: 'Caminho Português Central',
    shortName: 'Central',
    description: 'O caminho clássico pelo interior: vilas de pedra do Minho, a ponte medieval de Ponte de Lima, a fortaleza de Valença e a catedral de Tui. Mais infraestrutura e mais peregrinos.',
    originId: 'porto',
    destinationId: 'santiago',
    totalKm: 243,
    attributes: { scenery: 0.75, crowd: 0.8, infrastructure: 0.95, avgLodgingEur: 18, pavedShare: 0.45, maxSlopePct: 14, trafficExposure: 0.45, socialScore: 0.9 },
    geometry: buildGeometry(centralStops),
    stops: centralStops,
    waypoints: waypoints('central', centralStops, [
      ['water', 'Fonte em Vilarinho', 26],
      ['pharmacy', 'Farmácia em Barcelos', 54],
      ['market', 'Mercado semanal de Barcelos (quintas-feiras)', 54],
      ['rest', 'Área de descanso no rio Neiva', 63],
      ['water', 'Fonte junto à ponte medieval', 87],
      ['no_signal', 'Serra da Labruja: sinal fraco', 97, 'Cerca de 4 km com cobertura irregular. Avise alguém antes de subir.'],
      ['danger', 'Subida íngreme da Labruja', 99, 'Trecho com pedras soltas e inclinação de até 14%. Evite com chuva forte.'],
      ['shelter', 'Abrigo na Portela Grande', 100],
      ['health', 'Centro de saúde em Valença', 123],
      ['transport', 'Estação de comboios de Valença / autocarro em Tui', 124],
      ['detour', 'Variante complementar pelo rio Louro', 136, 'Alternativa mais verde ao polígono industrial de O Porriño.'],
      ['danger', 'Travessia da N-550 perto de Arcade', 165, 'Atravesse apenas na passadeira sinalizada.'],
      ['toilet', 'Banheiros públicos em Pontevedra', 177],
      ['transport', 'Estação ferroviária de Pontevedra', 177],
      ['water', 'Fonte em Caldas de Reis', 199],
      ['viewpoint', 'Vista para Santiago no Milladoiro', 236],
      ['pharmacy', 'Farmácia em Padrón', 218],
    ]),
    alerts: [
      ...alertsCommon,
      { id: 'alert-labruja', severity: 'warning', title: 'Serra da Labruja', description: 'Maior subida do percurso (~400 m). Comece cedo, leve água e evite em dia de chuva forte.', km: 99, verifiedAt: demoProvenance.fetchedAt },
      { id: 'alert-porrino', severity: 'info', title: 'Zona industrial de O Porriño', description: 'Há uma variante complementar mais agradável pelo rio Louro.', km: 136, verifiedAt: demoProvenance.fetchedAt },
    ],
    ...demoProvenance,
  },
  {
    id: 'costa',
    name: 'Caminho Português da Costa',
    shortName: 'Costa',
    description: 'Junto ao Atlântico: passadiços de madeira, praias, Viana do Castelo, travessia do rio Minho de barco e as rias galegas. Paisagem marcante, mais vento e mais quilômetros.',
    originId: 'porto',
    destinationId: 'santiago',
    totalKm: 271,
    attributes: { scenery: 0.95, crowd: 0.5, infrastructure: 0.8, avgLodgingEur: 24, pavedShare: 0.6, maxSlopePct: 9, trafficExposure: 0.35, socialScore: 0.6 },
    geometry: buildGeometry(costaStops, 0.004),
    stops: costaStops,
    waypoints: waypoints('costa', costaStops, [
      ['water', 'Fonte no passadiço de Matosinhos', 10],
      ['toilet', 'Banheiros na praia de Vila do Conde', 33],
      ['pharmacy', 'Farmácia em Esposende', 57],
      ['viewpoint', 'Santa Luzia, Viana do Castelo', 81],
      ['transport', 'Barco Caminha → A Guarda (horários sazonais)', 110, 'Confirme horários: o serviço pode não operar com mar agitado.'],
      ['no_signal', 'Costa entre Oia e Baiona: sinal irregular', 133],
      ['danger', 'Trecho junto à estrada PO-552', 136, 'Acostamento estreito; caminhe de frente para o trânsito.'],
      ['health', 'Hospital em Vigo', 169],
      ['market', 'Mercado de Vigo', 169],
      ['transport', 'Estação ferroviária de Pontevedra', 205],
      ['water', 'Fonte em Caldas de Reis', 227],
    ]),
    alerts: [
      ...alertsCommon,
      { id: 'alert-ferry', severity: 'warning', title: 'Travessia do rio Minho', description: 'Depende de barco com horários sazonais. Alternativa: seguir até Valença/Tui pela ecopista.', km: 110, verifiedAt: demoProvenance.fetchedAt },
      { id: 'alert-wind', severity: 'info', title: 'Exposição a vento e sol', description: 'Pouca sombra no litoral. Protetor solar e corta-vento.', verifiedAt: demoProvenance.fetchedAt },
    ],
    ...demoProvenance,
  },
  {
    id: 'espiritual',
    name: 'Central + Variante Espiritual',
    shortName: 'Espiritual',
    description: 'Segue a Rota Central até Pontevedra e desvia pelo mosteiro de Armenteira e a rota da pedra e da água, terminando com a travessia de barco pela ria de Arousa (Translatio).',
    originId: 'porto',
    destinationId: 'santiago',
    totalKm: 249,
    attributes: { scenery: 0.9, crowd: 0.3, infrastructure: 0.6, avgLodgingEur: 22, pavedShare: 0.35, maxSlopePct: 18, trafficExposure: 0.25, socialScore: 0.45 },
    geometry: buildGeometry(espiritualStops),
    stops: espiritualStops,
    waypoints: waypoints('espiritual', espiritualStops, [
      ['pharmacy', 'Farmácia em Barcelos', 54],
      ['no_signal', 'Serra da Labruja: sinal fraco', 97],
      ['danger', 'Subida íngreme da Labruja', 99],
      ['viewpoint', 'Hórreos de Combarro', 189],
      ['danger', 'Subida a Armenteira', 195, 'Inclinação de até 18% em trilho de pedra.'],
      ['water', 'Rota da Pedra e da Água (fontes e moinhos)', 205],
      ['no_signal', 'Vale do rio Armenteira: sinal fraco', 206],
      ['transport', 'Barco Translatio Vilanova → Pontecesures', 222, 'Cerca de 28 km pela ria, NÃO caminhados. Reserva necessária; operação sazonal.'],
      ['transport', 'Estação ferroviária de Padrón', 224],
    ]),
    alerts: [
      ...alertsCommon,
      { id: 'alert-boat', severity: 'warning', title: 'Trecho de barco obrigatório', description: 'Vilanova de Arousa → Pontecesures é feito de barco (~28 km). Os km deste trecho não contam como caminhada. Verifique a operação antes.', km: 222, verifiedAt: demoProvenance.fetchedAt },
      { id: 'alert-fewservices', severity: 'warning', title: 'Menos serviços', description: 'Poucas farmácias e transportes entre Pontevedra e Vilanova de Arousa.', km: 198, verifiedAt: demoProvenance.fetchedAt },
    ],
    ...demoProvenance,
  },
];

export function getRoute(id: string): Route | undefined {
  return routes.find((r) => r.id === id);
}

/** Origens disponíveis no planejador (ids de paradas comuns a todas as rotas do MVP). */
export const origins = [
  { id: 'porto', name: 'Porto' },
  { id: 'barcelos', name: 'Barcelos' },
  { id: 'pontedelima', name: 'Ponte de Lima' },
  { id: 'tui', name: 'Tui (últimos ~118 km)' },
  { id: 'pontevedra', name: 'Pontevedra' },
];

export const destinations = [{ id: 'santiago', name: 'Santiago de Compostela' }];
