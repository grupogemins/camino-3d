/**
 * Pontos de interesse: monumentos públicos reais, com descrição resumida de conhecimento geral.
 * Horários e preços são DEMONSTRAÇÃO — sempre confirmar na fonte oficial.
 * Eventos: FICTÍCIOS, gerados em datas relativas à viagem.
 */
import type { Event, PointOfInterest } from '@/lib/domain/types';
import { addDays } from '@/lib/format';
import { demoProvenance, demoProvenanceFrom } from './provenance';
import { getStop } from './stops';

type PoiInput = [id: string, stopId: string, name: string, category: PointOfInterest['category'], description: string, hours?: string, priceEur?: number, etiquette?: string];

const POIS: PoiInput[] = [
  ['poi-se-porto', 'porto', 'Sé do Porto', 'church', 'Catedral românica com claustro gótico; ponto de partida tradicional e local para o primeiro carimbo da credencial.', '09:00–18:30', 3, 'Roupas que cubram os ombros; silêncio durante as missas.'],
  ['poi-barcelos-galo', 'barcelos', 'Paço dos Condes e lenda do Galo', 'monument', 'Ruínas do século XV ligadas à lenda do Galo de Barcelos, símbolo de Portugal.', 'Livre'],
  ['poi-barcelos-feira', 'barcelos', 'Feira semanal de Barcelos', 'market', 'Uma das feiras mais antigas de Portugal, tradicionalmente às quintas-feiras no Campo da República.', 'Quintas, 07:00–14:00'],
  ['poi-ponte-lima', 'pontedelima', 'Ponte medieval de Ponte de Lima', 'bridge', 'Ponte romana e medieval sobre o rio Lima, uma das imagens mais marcantes do Caminho.', 'Livre'],
  ['poi-valenca', 'tui', 'Fortaleza de Valença', 'monument', 'Fortificação abaluartada sobre o rio Minho, frente a Tui; a ponte internacional cruza para a Espanha.', 'Livre'],
  ['poi-tui-catedral', 'tui', 'Catedral de Tui', 'church', 'Catedral-fortaleza românica e gótica no alto da cidade antiga.', '10:45–14:00 · 16:00–19:00', 4, 'Na Espanha, a hora local é uma hora a mais que em Portugal.'],
  ['poi-redondela', 'redondela', 'Viadutos de Redondela', 'monument', 'Dois grandes viadutos ferroviários do século XIX que marcam a paisagem da vila.', 'Livre'],
  ['poi-peregrina', 'pontevedra', 'Santuário da Virxe Peregrina', 'church', 'Igreja barroca em forma de vieira, padroeira da província de Pontevedra.', '09:00–21:00', 0, 'Entrada gratuita; doações são bem-vindas.'],
  ['poi-pontevedra-velha', 'pontevedra', 'Centro histórico de Pontevedra', 'monument', 'Um dos cascos históricos mais bem preservados da Galiza, com prioridade a pedestres.', 'Livre'],
  ['poi-caldas-termas', 'caldas', 'Fonte termal de Caldas de Reis', 'monument', 'Fonte de águas termais onde peregrinos costumam descansar os pés.', 'Livre', 0, 'Não use sabão na fonte pública.'],
  ['poi-padron-pedron', 'padron', 'Igreja de Santiago e o Pedrón', 'church', 'Segundo a tradição, a pedra onde a barca com o corpo do apóstolo foi amarrada.', '10:00–13:00 · 16:30–20:00'],
  ['poi-combarro', 'combarro', 'Hórreos de Combarro', 'monument', 'Conjunto de hórreos e cruceiros à beira da ria.', 'Livre'],
  ['poi-armenteira', 'armenteira', 'Mosteiro de Armenteira', 'church', 'Mosteiro cisterciense do século XII; início da Rota da Pedra e da Água.', '10:00–13:30 · 16:00–19:00', 2],
  ['poi-viana-luzia', 'viana', 'Santuário de Santa Luzia', 'viewpoint', 'Basílica no alto do monte com uma das vistas mais famosas de Portugal.', '08:00–19:00'],
  ['poi-baiona', 'baiona', 'Fortaleza de Monterreal', 'monument', 'Fortaleza junto ao mar; Baiona recebeu em 1493 a notícia da chegada de Colombo à América.', '10:00–21:00', 1],
  ['poi-santiago-catedral', 'santiago', 'Catedral de Santiago de Compostela', 'church', 'Destino final do Caminho. A Missa do Peregrino é celebrada diariamente.', '07:00–21:00', 0, 'Mochilas grandes não são permitidas dentro da catedral.'],
  ['poi-oficina', 'santiago', 'Oficina do Peregrino', 'monument', 'Local oficial para solicitar a Compostela com a credencial carimbada (mínimo de 100 km a pé).', '09:00–19:00'],
];

export const pointsOfInterest: PointOfInterest[] = POIS.map(([id, stopId, name, category, description, openingHours, priceEur, etiquette]) => {
  const stop = getStop(stopId)!;
  return {
    id,
    name,
    category,
    description,
    openingHours,
    etiquette,
    stopId,
    town: stop.name,
    coord: [stop.coord[0] + 0.002, stop.coord[1] + 0.001],
    distanceFromRouteKm: 0.2,
    accessible: category !== 'viewpoint',
    provenance: demoProvenanceFrom('Conteúdo cultural (horários a confirmar)'),
    price: priceEur !== undefined ? { amount: priceEur, currency: 'EUR', unit: 'per_ticket', isEstimate: true, ...demoProvenanceFrom('Preços') } : undefined,
  };
});

type EventInput = [stopId: string, title: string, category: Event['category'], dayOffset: number, startHour: number, durationH: number, priceEur: number | null, description: string];

const EVENT_TEMPLATES: EventInput[] = [
  ['porto', 'Concerto de órgão na Sé (fictício)', 'concert', 0, 18, 1, 5, 'Recital de órgão inventado para demonstração.'],
  ['barcelos', 'Feira de artesanato e cerâmica (fictícia)', 'fair', 2, 8, 6, null, 'Barro, cestaria e o famoso galo colorido.'],
  ['pontedelima', 'Festival do vinho verde (fictício)', 'gastronomy', 3, 17, 5, 8, 'Provas de vinho verde e petiscos minhotos.'],
  ['tui', 'Visita guiada à catedral ao entardecer (fictícia)', 'religious', 5, 19, 1, 6, 'Roteiro histórico com foco nos peregrinos medievais.'],
  ['redondela', 'Festa do choco (fictícia)', 'festival', 6, 12, 8, null, 'Barraquinhas de choco (sépia) e música tradicional.'],
  ['pontevedra', 'Mercado de abastos aos sábados (fictício)', 'market', 7, 9, 5, null, 'Produtos locais, queijos e pães galegos.'],
  ['pontevedra', 'Concerto de gaitas na praça (fictício)', 'concert', 7, 20, 2, null, 'Música tradicional galega ao ar livre.'],
  ['caldas', 'Bênção dos peregrinos (fictícia)', 'religious', 8, 19, 1, null, 'Celebração aberta a peregrinos de todas as crenças.'],
  ['padron', 'Feira dos pimentos de Padrón (fictícia)', 'gastronomy', 10, 11, 6, null, '"Uns picam e outros não".'],
  ['santiago', 'Missa do Peregrino', 'religious', 11, 12, 1, null, 'Celebrada diariamente na catedral (horário de demonstração; confirme na fonte oficial).'],
  ['santiago', 'Concerto de tunas universitárias (fictício)', 'concert', 11, 21, 2, null, 'Grupos de estudantes cantam pelas ruas da cidade velha.'],
  ['viana', 'Romaria do mar (fictícia)', 'festival', 3, 16, 4, null, 'Trajes tradicionais e procissão junto ao rio Lima.'],
  ['vigo', 'Mercado de ostras da Pedra (fictício)', 'gastronomy', 7, 10, 6, null, 'Ostras frescas servidas no mercado.'],
];

/** Gera eventos com datas relativas ao início da viagem. */
export function eventsForTrip(startDate: string): Event[] {
  return EVENT_TEMPLATES.map(([stopId, title, category, dayOffset, startHour, durationH, priceEur, description], i) => {
    const stop = getStop(stopId)!;
    const day = addDays(startDate, dayOffset);
    const startsAt = `${day}T${String(startHour).padStart(2, '0')}:00:00+02:00`;
    const endsAt = new Date(new Date(startsAt).getTime() + durationH * 3_600_000).toISOString();
    return {
      id: `evt-${i}`,
      title,
      category,
      town: stop.name,
      stopId,
      coord: stop.coord,
      startsAt,
      endsAt,
      priceEur,
      description,
      provenance: { ...demoProvenance, source: 'Agenda cultural — demonstração (eventos fictícios)' },
    };
  });
}
