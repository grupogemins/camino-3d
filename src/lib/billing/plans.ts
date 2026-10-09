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
  | 'community_advanced';

export interface Plan {
  id: PlanId;
  name: string;
  priceEur: number;
  billing: string;
  highlight?: boolean;
  features: Feature[];
  bullets: string[];
}

const FREE_FEATURES: Feature[] = ['basic_planning', 'essential_phrases', 'community_basic'];
const PREMIUM_FEATURES: Feature[] = [
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
];

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    priceEur: 0,
    billing: 'para sempre',
    features: FREE_FEATURES,
    bullets: ['Planejamento básico', 'Uma viagem ativa', 'Até 3 estabelecimentos por categoria em cada parada', 'Frases essenciais offline', 'Comunidade com limites (5 mensagens/dia)'],
  },
  {
    id: 'pass',
    name: 'Passe do Caminho',
    priceEur: 10,
    billing: 'pagamento único · 45 dias',
    highlight: true,
    features: PREMIUM_FEATURES,
    bullets: ['Tudo do Premium durante 45 dias', 'Sem renovação automática', 'Ideal para uma peregrinação'],
  },
  {
    id: 'monthly',
    name: 'Premium',
    priceEur: 10,
    billing: 'por mês · cancele quando quiser',
    features: PREMIUM_FEATURES,
    bullets: ['Rotas alternativas avançadas', 'Navegação e mapas offline', 'Clima por etapa e alertas', 'Tradutor por voz', 'Filtros avançados e diário completo', 'Avatar ampliado e comunidade avançada'],
  },
];

export const FREE_LIMITS = {
  activeTrips: 1,
  placesPerCategory: 3,
  messagesPerDay: 5,
};

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** Plano efetivo: assinatura ativa e dentro do período; senão volta ao gratuito. */
export function effectivePlan(sub: Pick<Subscription, 'plan' | 'status' | 'currentPeriodEnd'> | null | undefined, now = new Date()): PlanId {
  if (!sub) return 'free';
  const activeStatus = sub.status === 'active' || sub.status === 'trialing';
  const inPeriod = !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd).getTime() > now.getTime();
  return activeStatus && inPeriod ? sub.plan : 'free';
}

export function hasFeature(planId: PlanId, feature: Feature): boolean {
  return getPlan(planId).features.includes(feature);
}

export function periodEndFor(planId: PlanId, from = new Date()): string | undefined {
  if (planId === 'pass') return new Date(from.getTime() + 45 * 86_400_000).toISOString();
  if (planId === 'monthly') {
    const d = new Date(from);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }
  return undefined;
}
