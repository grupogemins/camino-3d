import type { Sponsor, SponsoredPlacement } from '@/lib/domain/types';
import { DEMO_FETCHED_AT } from './provenance';

export const sponsors: Sponsor[] = [
  { id: 'sp-1', name: 'Pousada Pedra Velha (fictícia)', category: 'accommodation', contactEmail: 'parcerias@exemplo.test', status: 'active', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'sp-2', name: 'Café O Bordão (fictício)', category: 'restaurant', contactEmail: 'ola@exemplo.test', status: 'active', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'sp-3', name: 'Loja do Peregrino (fictícia)', category: 'shop', contactEmail: 'loja@exemplo.test', status: 'lead', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
  { id: 'sp-4', name: 'Transporte de Mochilas Minho (fictício)', category: 'service', contactEmail: 'mochilas@exemplo.test', status: 'paused', createdAt: DEMO_FETCHED_AT, updatedAt: DEMO_FETCHED_AT },
];

export function sponsoredPlacement(sponsorId: string, placeId: string, boost = 0.4): SponsoredPlacement {
  return { id: `pl-${placeId}`, sponsorId, label: 'Patrocinado', placeId, startsAt: '2026-01-01T00:00:00Z', endsAt: '2027-12-31T23:59:59Z', boost };
}
