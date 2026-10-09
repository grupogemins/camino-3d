/** DADOS DE DEMONSTRAÇÃO — hospedagens fictícias. Nomes, preços, avaliações e disponibilidade são inventados. */
import type { Accommodation, AccommodationType, BookingProvider } from '@/lib/domain/types';
import { demoProvenance, demoProvenanceFrom } from './provenance';
import { between, hashString, pick, seeded } from './seed';
import { sponsoredPlacement } from './sponsors';
import { allStops } from './stops';

const NAMES: Record<AccommodationType, string[]> = {
  albergue: ['Albergue Concha Dourada', 'Albergue Seta Amarela', 'Albergue Municipal (demo)', 'Albergue O Cajado'],
  hostel: ['Hostel Rua Nova', 'Hostel Caminhantes', 'Hostel Bordão & Pão'],
  hotel: ['Hotel Rio Manso', 'Hotel Muralha', 'Hotel Praça Velha'],
  pousada: ['Pousada Pedra Velha', 'Pousada Ponte Antiga', 'Pousada Vinha Verde'],
  casa_rural: ['Casa Rural Carvalho', 'Casa do Hórreo', 'Quinta das Camélias'],
  camping: ['Parque de Campismo do Rio'],
  religioso: ['Casa de Acolhida Paroquial (demo)'],
};

const PRICE: Record<AccommodationType, [number, number]> = {
  albergue: [8, 16],
  hostel: [16, 28],
  hotel: [60, 120],
  pousada: [45, 85],
  casa_rural: [50, 95],
  camping: [7, 14],
  religioso: [0, 0],
};

const DEMO_PROVIDER: BookingProvider = {
  id: 'demo-provider',
  name: 'Fornecedor autorizado (integração não contratada)',
  kind: 'direct_contact',
  url: '#integracao-pendente',
};

export const accommodations: Accommodation[] = allStops
  .filter((s) => s.services.lodging)
  .flatMap((stop) => {
    const rnd = seeded(hashString(stop.id));
    const types: AccommodationType[] = ['albergue', 'hostel', 'pousada'];
    if (rnd() > 0.4) types.push('hotel');
    if (rnd() > 0.6) types.push('casa_rural');
    if (rnd() > 0.85) types.push('religioso');
    if (stop.region === 'rias_baixas' && rnd() > 0.7) types.push('camping');
    return types.map((type, i): Accommodation => {
      const id = `acc-${stop.id}-${i}`;
      const [min, max] = PRICE[type];
      const amount = between(rnd, min, max);
      const isDonation = type === 'religioso';
      const sponsored = type === 'pousada' && ['pontedelima', 'pontevedra', 'caldas', 'viana'].includes(stop.id) ? sponsoredPlacement('sp-1', id) : undefined;
      return {
        id,
        name: pick(rnd, NAMES[type]),
        type,
        coord: [stop.coord[0] + between(rnd, -0.008, 0.008, 4), stop.coord[1] + between(rnd, -0.006, 0.006, 4)],
        stopId: stop.id,
        town: stop.name,
        distanceFromRouteKm: between(rnd, 0.05, 1.8, 1),
        accessible: type === 'hotel' || rnd() > 0.65,
        review: { rating: between(rnd, 3.7, 4.9, 1), count: Math.round(between(rnd, 8, 900)), ...demoProvenanceFrom('Avaliações') },
        sponsored,
        provenance: demoProvenance,
        price: {
          amount,
          currency: 'EUR',
          unit: 'per_night',
          knownFees: isDonation ? 'Donativo voluntário' : type === 'hotel' ? 'Taxa turística municipal pode ser cobrada à parte' : undefined,
          isEstimate: true,
          ...demoProvenanceFrom('Preços'),
        },
        availability: pick(rnd, ['available', 'available', 'limited', 'full', 'unknown'] as const),
        amenities: {
          breakfast: type !== 'albergue' || rnd() > 0.6,
          laundry: rnd() > 0.3,
          kitchen: type === 'albergue' || type === 'hostel' ? rnd() > 0.2 : false,
          bikeStorage: rnd() > 0.4,
          privateRoom: type !== 'albergue' && type !== 'camping',
          dorm: type === 'albergue' || type === 'hostel' || type === 'religioso',
          petsAllowed: type === 'camping' || rnd() > 0.75,
          freeCancellation: type === 'hotel' || type === 'pousada' ? rnd() > 0.3 : false,
        },
        checkInFrom: pick(rnd, ['12:00', '13:00', '14:00', '15:00']),
        beds: type === 'albergue' || type === 'hostel' ? Math.round(between(rnd, 16, 60)) : undefined,
        description: `${type === 'albergue' ? 'Albergue' : 'Hospedagem'} fictícia em ${stop.name}, criada apenas para demonstrar o aplicativo.`,
        bookingProviders: [DEMO_PROVIDER],
      };
    });
  });

export function getAccommodation(id: string) {
  return accommodations.find((a) => a.id === id);
}
