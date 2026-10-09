import type { Report } from '@/lib/domain/types';
import { DEMO_FETCHED_AT } from './provenance';

export const demoReports: (Report & { targetName: string; excerpt: string })[] = [
  { id: 'r1', reporterId: 'p1', targetUserId: 'x1', targetName: 'Usuário fictício A', reason: 'spam', details: 'Links repetidos para venda de passeios.', excerpt: 'Promo!!! passeios baratos clique aqui…', status: 'open', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'r2', reporterId: 'p6', targetUserId: 'x2', targetName: 'Usuário fictício B', reason: 'unsafe_meeting', details: 'Insistiu em encontrar no albergue à noite.', excerpt: 'Me diz em qual albergue você vai dormir…', status: 'open', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'r3', reporterId: 'p3', targetUserId: 'x3', targetName: 'Usuário fictício C', reason: 'harassment', details: 'Mensagens ofensivas.', excerpt: '[conteúdo ofensivo ocultado]', status: 'reviewing', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
];

/** Funil semanal SIMULADO para o painel administrativo. */
export const demoFunnel = [
  { step: 'Visitantes', event: 'page_view', value: 12000 },
  { step: 'Cadastro iniciado', event: 'signup_started', value: 2400 },
  { step: 'Cadastro concluído', event: 'signup_completed', value: 1680 },
  { step: 'Onboarding concluído', event: 'onboarding_completed', value: 1310 },
  { step: 'Rota criada', event: 'route_created', value: 1050 },
  { step: 'Teste Camino Pass', event: 'premium_trial_started', value: 380 },
  { step: 'Compra do Camino Pass', event: 'subscription_completed', value: 330 },
];

export const demoKpis = {
  retentionD7: 0.41,
  retentionD30: 0.18,
  conversion: 330 / 12000,
  passesSold: 330,
  /** Mistura de preço cheio, lançamento e cupons de criadores. */
  grossRevenueEur: 330 * 12.4,
  affiliateShare: 0.38,
  refundRate: 0.03,
  bookingClicks: 920,
  translationsUsed: 2140,
  locationSharingEnabled: 0.27,
  connections: 610,
};
