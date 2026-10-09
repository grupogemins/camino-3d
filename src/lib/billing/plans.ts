import type { PlanId, Subscription } from '@/lib/domain/types';

export type Feature =
  | 'basic_planning'
  | 'multiple_trips'
  | 'advanced_routes'
  | 'offline_maps'
  | 'stage_weather'
  | 'voice_translator'
  | 'essential_phrases'
  | 'advanced_filters'
  | 'full_journal'
  | 'alerts'
  | 'avatar_extended'
  | 'community_basic'
  | 'community_advanced'
  | 'copilot_full'
  | 'live_reports'
  | 'stage_cards'
  | 'retrospective';

export interface Plan {
  id: PlanId;
  name: string;
  /** Preço de tabela. Cupons de lançamento e de afiliado podem reduzir (ver coupons.ts). */
  priceEur: number;
  billing: string;
  highlight?: boolean;
  seats: number;
  features: Feature[];
  bullets: string[];
}

const FREE_FEATURES: Feature[] = ['basic_planning', 'essential_phrases', 'community_basic', 'stage_cards'];
const PASS_FEATURES: Feature[] = [
  ...FREE_FEATURES,
  'multiple_trips',
  'advanced_routes',
  'offline_maps',
  'stage_weather',
  'voice_translator',
  'advanced_filters',
  'full_journal',
  'alerts',
  'avatar_extended',
  'community_advanced',
  'copilot_full',
  'live_reports',
  'retrospective',
];

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    priceEur: 0,
    billing: 'para sempre',
    seats: 1,
    features: FREE_FEATURES,
    bullets: ['Explorar rotas e planejar a viagem', 'Criar seu peregrino 3D', 'Uma sugestão do copiloto por dia', 'Frases essenciais offline', 'Comunidade com limites (5 mensagens/dia)'],
  },
  {
    id: 'pass',
    name: 'Camino Pass',
    priceEur: 14.99,
    billing: 'pagamento único · uma jornada',
    highlight: true,
    seats: 1,
    features: PASS_FEATURES,
    bullets: [
      'Sem assinatura e sem renovação',
      'Jornada liberada para sempre: planejamento, viagem e memórias',
      'Copiloto completo com sugestões do dia',
      'Mapas offline, clima por etapa e alertas',
      'Camino Live: alertas da comunidade e grupos',
      'Retrospectiva final e cartões de etapa sem marca d\'água',
    ],
  },
  {
    id: 'group',
    name: 'Grupo/Família',
    priceEur: 34.99,
    billing: 'pagamento único · até 4 pessoas',
    seats: 4,
    features: PASS_FEATURES,
    bullets: ['Tudo do Camino Pass para até 4 pessoas', '3 convites para quem caminha com você', 'Mesma jornada, cada um com seu peregrino'],
  },
];

export const FREE_LIMITS = {
  activeTrips: 1,
  placesPerCategory: 3,
  messagesPerDay: 5,
  copilotSuggestionsPerDay: 1,
};

/** Uso justo dos recursos com custo por uso (APIs pagas). */
export const FAIR_USE = {
  machineTranslationsPerJourney: 300,
};

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** Plano efetivo: compra ativa (o passe não expira) ou teste dentro do prazo; senão volta ao gratuito. */
export function effectivePlan(sub: Pick<Subscription, 'plan' | 'status' | 'currentPeriodEnd'> | null | undefined, now = new Date()): PlanId {
  if (!sub) return 'free';
  const activeStatus = sub.status === 'active' || sub.status === 'trialing';
  const inPeriod = !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd).getTime() > now.getTime();
  return activeStatus && inPeriod ? sub.plan : 'free';
}

export function hasFeature(planId: PlanId, feature: Feature): boolean {
  return getPlan(planId).features.includes(feature);
}

/** Só o teste gratuito tem data de fim. A compra do passe não expira. */
export function trialEndFor(from = new Date(), days = 7): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

/** Prazo legal de desistência na UE para conteúdo digital (o usuário pode renunciar ao começar a usar). */
export const REFUND_WINDOW_DAYS = 14;
