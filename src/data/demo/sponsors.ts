import type { PartnerOffer, Sponsor, SponsoredPlacement } from '@/lib/domain/types';
import { DEMO_FETCHED_AT } from './provenance';

export const sponsors: Sponsor[] = [
  { id: 'sp-1', name: 'Pousada Pedra Velha (fictícia)', category: 'accommodation', contactEmail: 'parcerias@exemplo.test', status: 'active', tier: 'founding', verified: true, pricing: 'season', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'sp-2', name: 'Café O Bordão (fictício)', category: 'restaurant', contactEmail: 'ola@exemplo.test', status: 'active', tier: 'founding', verified: true, pricing: 'per_result', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'sp-3', name: 'Loja do Peregrino (fictícia)', category: 'shop', contactEmail: 'loja@exemplo.test', status: 'lead', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'sp-4', name: 'Transporte de Mochilas Minho (fictício)', category: 'service', contactEmail: 'mochilas@exemplo.test', status: 'paused', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
];

export function sponsoredPlacement(sponsorId: string, placeId: string, boost = 0.4): SponsoredPlacement {
  return { id: `pl-${placeId}`, sponsorId, label: 'Patrocinado', placeId, startsAt: '2026-01-01T00:00:00Z', endsAt: '2027-12-31T23:59:59Z', boost };
}

/** Ofertas exclusivas de parceiros fundadores (fictícias). */
export function partnerOffer(sponsorId: string, placeId: string): PartnerOffer {
  const title = sponsorId === 'sp-1' ? '10% de desconto na diária para peregrinos com o app' : 'Café + pastel por EUR 2,50 para peregrinos';
  const couponCode = sponsorId === 'sp-1' ? 'PEDRAVELHA10' : 'BORDAO250';
  return { id: `of-${placeId}`, sponsorId, placeId, title, couponCode, validUntil: '2027-10-31T23:59:59Z' };
}

/** Painel de desempenho SIMULADO por parceiro (contagens agregadas e anônimas). */
export const demoPartnerStats: Record<string, { views: number; contactClicks: number; passersBy: number; couponsRedeemed: number; bookingsAttributed: number }> = {
  'sp-1': { views: 3820, contactClicks: 412, passersBy: 2960, couponsRedeemed: 57, bookingsAttributed: 41 },
  'sp-2': { views: 2210, contactClicks: 0, passersBy: 4105, couponsRedeemed: 188, bookingsAttributed: 0 },
};
