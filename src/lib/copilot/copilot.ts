/**
 * Copiloto de peregrinação: regras transparentes que cruzam etapa, ritmo, clima, hospedagem,
 * alimentação e relatos da comunidade para sugerir decisões do dia.
 *
 * Princípios:
 * - Cada sugestão diz em que dados se baseia (e se são de demonstração).
 * - Patrocínio nunca entra: hospedagens são ordenadas só pela relevância orgânica.
 * - Nunca afirma que um trecho é "seguro"; fala em risco, tempo e alternativas.
 */
import type { Accommodation, FoodPreference, LiveReport, Profile, Restaurant, Route, RouteSegment, Trip, WeatherSnapshot } from '@/lib/domain/types';
import { intermediateLodgingStops } from '@/lib/planner/planner';
import { organicScore } from '@/lib/ranking';

export type SuggestionKind = 'weather' | 'pace' | 'lodging' | 'elevation' | 'water' | 'food' | 'daylight' | 'community' | 'creator';

export interface SuggestionAction {
  label: string;
  href?: string;
  /** Ação executada no app (replanejar a etapa). */
  shorten?: { segmentId: string; stopId: string };
}

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  /** 0 = mais urgente. */
  priority: number;
  title: string;
  body: string;
  actions: SuggestionAction[];
  basedOn: string[];
  usesDemoData: boolean;
}

export interface CopilotInput {
  trip: Trip;
  route: Route;
  segment: RouteSegment;
  profile: Pick<Profile, 'dailyKm' | 'dailyBudgetEur' | 'food' | 'fitness'> | null;
  weather?: WeatherSnapshot | null;
  accommodations?: Accommodation[];
  restaurants?: Restaurant[];
  reports?: LiveReport[];
  creatorTip?: { author: string; text: string };
  now?: Date;
}

const DEFAULT_START_HOUR = 7.5;
const EARLIEST_START = 6.5;
const RAINY = new Set(['rain', 'showers', 'storm']);

const pad = (n: number) => String(n).padStart(2, '0');
export function hhmm(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60 / 15) * 15;
  return m === 60 ? `${pad(h + 1)}:00` : `${pad(h)}:${pad(m)}`;
}
const fmtKm = (n: number) => `${Math.round(n)} km`;
const eur = (n: number) => `EUR ${n.toFixed(0)}`;

/** Fuso da etapa: Portugal está uma hora atrás da Galiza. */
export function timeZoneFor(region: Route['stops'][number]['region']): string {
  return region === 'porto' || region === 'minho' ? 'Europe/Lisbon' : 'Europe/Madrid';
}

/** Hora local (decimal) de um instante ISO no fuso informado. */
function localHour(iso: string, timeZone: string): number {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h + m / 60;
}

function parseClock(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h + (m || 0) / 60;
}

/** Melhor hospedagem orgânica com vaga e dentro do orçamento numa parada. */
function bestLodging(list: Accommodation[], stopId: string, budget: number): Accommodation | undefined {
  return list
    .filter((a) => a.stopId === stopId && a.availability !== 'full' && a.price.amount <= budget)
    .sort((a, b) => organicScore(b) - organicScore(a))[0];
}

function lodgingBudget(profile: CopilotInput['profile']): number {
  // ~45% do orçamento diário para dormir (o resto: comida e extras).
  return Math.max(15, Math.round((profile?.dailyBudgetEur ?? 50) * 0.45));
}

function src(label: string, isDemo: boolean) {
  return `${label}${isDemo ? ' (demonstração)' : ''}`;
}

/** Paradas com hospedagem para encurtar, a mais próxima de uma distância-alvo. */
function shorterStop(route: Route, seg: RouteSegment, targetKm: number) {
  const options = intermediateLodgingStops(route, seg);
  return options.sort((a, b) => Math.abs(a.km - seg.startKm - targetKm) - Math.abs(b.km - seg.startKm - targetKm))[0];
}

export function copilotSuggestions(input: CopilotInput): Suggestion[] {
  const { trip, route, segment: seg, profile, weather, accommodations = [], restaurants = [], reports = [] } = input;
  const out: Suggestion[] = [];
  const startHour = DEFAULT_START_HOUR;
  const arrival = startHour + seg.estimatedHours;
  const budget = lodgingBudget(profile);
  const accDemo = accommodations.some((a) => a.provenance.isDemo);
  const tz = timeZoneFor(route.stops.find((s) => s.id === seg.toStopId)?.region ?? 'santiago');

  // 1) Clima: chuva forte durante a caminhada.
  if (weather) {
    const rain = weather.hourly.find((h) => RAINY.has(h.condition) && h.precipProb >= 60 && localHour(h.time, tz) >= startHour && localHour(h.time, tz) <= arrival + 1);
    if (rain) {
      const rainAt = localHour(rain.time, tz);
      const depart = rainAt - seg.estimatedHours - 0.5;
      const alt = shorterStop(route, seg, Math.max(5, (rainAt - startHour - 0.5) * (seg.distanceKm / seg.estimatedHours)));
      const actions: SuggestionAction[] = [];
      let body: string;
      if (depart >= EARLIEST_START) {
        body = `Chuva forte prevista a partir das ${hhmm(rainAt)}. Saindo às ${hhmm(depart)} você deve chegar a ${seg.toName} antes dela.`;
      } else {
        body = `Chuva forte prevista a partir das ${hhmm(rainAt)}, antes do fim da etapa mesmo saindo cedo.`;
      }
      if (alt) {
        const cut = seg.endKm - alt.km;
        const lodge = bestLodging(accommodations, alt.id, budget);
        body += ` Outra opção: terminar em ${alt.name}, ${fmtKm(cut)} antes.`;
        if (lodge) body += ` Lá há ${lodge.name}${lodge.review ? ` (${lodge.review.rating.toLocaleString('pt-BR')}★)` : ''} por ${eur(lodge.price.amount)}.`;
        actions.push({ label: `Terminar em ${alt.name}`, shorten: { segmentId: seg.id, stopId: alt.id } });
        if (lodge) actions.push({ label: 'Ver hospedagem', href: `/hospedagens/${lodge.id}` });
      } else if (depart < EARLIEST_START) {
        body += ' Leve capa de chuva e proteja a mochila. Se apertar, faça uma pausa num café ou use o transporte indicado na etapa.';
      }
      actions.push({ label: 'Previsão completa', href: '/clima' });
      out.push({
        id: `weather-${seg.id}-${rain.time.slice(0, 13)}`,
        kind: 'weather',
        priority: 0,
        title: 'Chuva no meio da etapa',
        body,
        actions,
        basedOn: [src(`Previsão ${weather.source}`, weather.isDemo), `Seu tempo estimado: ${seg.estimatedHours.toLocaleString('pt-BR')} h`, ...(alt ? [src('Hospedagens', accDemo)] : [])],
        usesDemoData: weather.isDemo || accDemo,
      });
    }
  }

  // 2) Ritmo: dias recentes acima da média ou etapa muito acima do desejado.
  const done = trip.segments.filter((s) => trip.completedSegmentIds.includes(s.id));
  const lastTwo = done.slice(-2);
  const target = profile?.dailyKm ?? trip.dailyKm;
  const recentAvg = lastTwo.length ? lastTwo.reduce((a, s) => a + s.distanceKm, 0) / lastTwo.length : 0;
  const tiredStreak = lastTwo.length === 2 && recentAvg > target * 1.15;
  const longStage = seg.distanceKm > target * 1.3;
  if (tiredStreak || longStage) {
    const alt = shorterStop(route, seg, target * (tiredStreak ? 0.8 : 1));
    if (alt) {
      const newKm = alt.km - seg.startKm;
      out.push({
        id: `pace-${seg.id}`,
        kind: 'pace',
        priority: 1,
        title: tiredStreak ? 'Hora de aliviar o ritmo' : 'Etapa longa para o seu ritmo',
        body: tiredStreak
          ? `Você caminhou em média ${fmtKm(recentAvg)} nos últimos dois dias, acima dos ${fmtKm(target)} que planejou. A etapa de ${seg.fromName} pode ser reduzida de ${fmtKm(seg.distanceKm)} para ${fmtKm(newKm)}, terminando em ${alt.name}. O restante da viagem é replanejado.`
          : `A etapa tem ${fmtKm(seg.distanceKm)}, bem acima dos ${fmtKm(target)} por dia que você escolheu. Terminando em ${alt.name}, ela fica com ${fmtKm(newKm)}.`,
        actions: [{ label: `Reduzir para ${fmtKm(newKm)}`, shorten: { segmentId: seg.id, stopId: alt.id } }, { label: 'Ver etapas', href: '/inicio' }],
        basedOn: [`Etapas concluídas: ${done.length}`, `Meta diária: ${fmtKm(target)}`, `Paradas com hospedagem da rota`],
        usesDemoData: false,
      });
    }
  }

  // 3) Hospedagem quase lotada no destino.
  const atDest = accommodations.filter((a) => a.stopId === seg.toStopId);
  if (atDest.length >= 3) {
    const tight = atDest.filter((a) => a.availability === 'full' || a.availability === 'limited').length / atDest.length;
    if (tight >= 0.5) {
      const top = atDest
        .filter((a) => a.availability !== 'full' && a.price.amount <= budget)
        .sort((a, b) => organicScore(b) - organicScore(a))
        .slice(0, 3);
      out.push({
        id: `lodging-${seg.id}`,
        kind: 'lodging',
        priority: 1,
        title: `${seg.toName} está quase lotada`,
        body: top.length
          ? `${Math.round(tight * 100)}% das hospedagens de ${seg.toName} estão lotadas ou com poucas vagas. Estas são as melhores com vaga até ${eur(budget)}: ${top.map((a) => `${a.name} (${eur(a.price.amount)})`).join(', ')}. Confirme direto com o estabelecimento.`
          : `${Math.round(tight * 100)}% das hospedagens de ${seg.toName} estão lotadas ou com poucas vagas e nenhuma com vaga cabe em ${eur(budget)}. Considere parar antes ou aumentar o orçamento desta noite.`,
        actions: [...top.slice(0, 2).map((a) => ({ label: a.name, href: `/hospedagens/${a.id}` })), { label: 'Todas as hospedagens', href: `/hospedagens?parada=${seg.toStopId}` }],
        basedOn: [src('Disponibilidade informada pelos estabelecimentos', accDemo), `Orçamento para dormir: ${eur(budget)}`, 'Ordem orgânica (sem patrocínio)'],
        usesDemoData: accDemo,
      });
    }
  }

  // 4) Subida forte.
  if (seg.ascentM >= 350) {
    out.push({
      id: `elev-${seg.id}`,
      kind: 'elevation',
      priority: 2,
      title: `Subida de ${seg.ascentM} m hoje`,
      body: `Comece cedo e guarde energia para a subida. Leve pelo menos 2 litros de água e faça pausas curtas a cada hora. Com chuva, o piso pode ficar escorregadio.`,
      actions: [{ label: 'Perfil de elevação', href: `/etapas/${seg.id}` }],
      basedOn: ['Elevação estimada da etapa'],
      usesDemoData: false,
    });
  }

  // 5) Água: calor e poucas fontes.
  const fountains = seg.waypoints.filter((w) => w.kind === 'water').length;
  const maxTemp = weather ? Math.max(...weather.hourly.slice(0, 12).map((h) => h.tempC)) : undefined;
  if (maxTemp !== undefined && maxTemp >= 25 && fountains <= 1) {
    out.push({
      id: `water-${seg.id}`,
      kind: 'water',
      priority: 1,
      title: 'Calor e pouca água no caminho',
      body: `Máxima de ${Math.round(maxTemp)}°C e ${fountains === 0 ? 'nenhuma fonte marcada' : 'só uma fonte marcada'} nesta etapa. Saia com 2 a 3 litros e reabasteça nos cafés.`,
      actions: [{ label: 'Onde encher a garrafa', href: '/comer' }],
      basedOn: [src(`Previsão ${weather!.source}`, weather!.isDemo), 'Pontos de água da etapa'],
      usesDemoData: weather!.isDemo,
    });
  }

  // 6) Luz do dia.
  if (weather?.sunset) {
    const sunset = parseClock(weather.sunset);
    if (arrival > sunset - 1) {
      out.push({
        id: `daylight-${seg.id}`,
        kind: 'daylight',
        priority: 0,
        title: 'Chegada perto do anoitecer',
        body: `Saindo às ${hhmm(startHour)}, a chegada estimada é ${hhmm(arrival)} e o sol se põe às ${weather.sunset}. Saia mais cedo ou encurte a etapa; evite estradas no escuro.`,
        actions: [{ label: 'Detalhes da etapa', href: `/etapas/${seg.id}` }],
        basedOn: [src('Pôr do sol', weather.isDemo), `Seu tempo estimado: ${seg.estimatedHours.toLocaleString('pt-BR')} h`],
        usesDemoData: weather.isDemo,
      });
    }
  }

  // 7) Alimentação conforme preferência.
  const diet = (profile?.food ?? []).find((f): f is Exclude<FoodPreference, 'local' | 'budget'> => f === 'vegan' || f === 'vegetarian' || f === 'gluten_free');
  if (diet && restaurants.length) {
    const key = diet === 'gluten_free' ? 'glutenFree' : diet;
    const label = diet === 'vegan' ? 'vegana' : diet === 'vegetarian' ? 'vegetariana' : 'sem glúten';
    const options = restaurants.filter((r) => r.stopId === seg.toStopId && r.diets[key]);
    const restDemo = restaurants.some((r) => r.provenance.isDemo);
    out.push({
      id: `food-${seg.id}-${diet}`,
      kind: 'food',
      priority: options.length ? 3 : 2,
      title: options.length ? `Comida ${label} em ${seg.toName}` : `Pouca opção ${label} em ${seg.toName}`,
      body: options.length
        ? `${options.length} lugar(es) com opção ${label}: ${options.slice(0, 2).map((r) => `${r.name} (${r.openingHours})`).join('; ')}.`
        : `Não encontramos lugar com opção ${label} confirmada no destino. Leve lanche do mercado da saída.`,
      actions: [{ label: 'Ver lugares', href: `/comer?parada=${seg.toStopId}` }],
      basedOn: [src('Cardápios e horários', restDemo), 'Sua preferência alimentar'],
      usesDemoData: restDemo,
    });
  }

  // 8) Relatos recentes da comunidade na etapa.
  const stageStops = new Set(route.stops.filter((s) => s.km >= seg.startKm && s.km <= seg.endKm).map((s) => s.id));
  const relevant = reports.filter((r) => stageStops.has(r.stopId) && r.kind !== 'tip');
  if (relevant.length) {
    const r = relevant[0];
    out.push({
      id: `live-${r.id}`,
      kind: 'community',
      priority: 2,
      title: `${relevant.length} relato(s) da comunidade nesta etapa`,
      body: `Mais recente: "${r.note}" Confirmado por ${r.confirmations} peregrino(s). Relatos expiram em 12 horas.`,
      actions: [{ label: 'Abrir Camino Live', href: '/comunidade?aba=ao-vivo' }],
      basedOn: [src('Camino Live', r.isDemo)],
      usesDemoData: r.isDemo,
    });
  }

  // 9) Dica do criador (rota de criador escolhida).
  if (input.creatorTip) {
    out.push({
      id: `creator-${seg.id}`,
      kind: 'creator',
      priority: 4,
      title: `Dica de ${input.creatorTip.author}`,
      body: input.creatorTip.text,
      actions: [],
      basedOn: ['Rota de criador escolhida por você'],
      usesDemoData: true,
    });
  }

  return out.sort((a, b) => a.priority - b.priority);
}
