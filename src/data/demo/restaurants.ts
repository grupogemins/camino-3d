/** DADOS DE DEMONSTRAÇÃO — cafés e restaurantes fictícios. */
import type { Restaurant } from '@/lib/domain/types';
import { demoProvenance, demoProvenanceFrom } from './provenance';
import { between, hashString, pick, seeded } from './seed';
import { partnerOffer, sponsoredPlacement } from './sponsors';
import { allStops } from './stops';

const NAMES = {
  cafe: ['Café O Bordão', 'Café da Vieira', 'Café Marco 100', 'Café do Lavadouro'],
  restaurant: ['Taberna A Vieira', 'Restaurante Lareira', 'Casa de Pasto do Rio', 'Mesón do Peregrino'],
  bar: ['Bar A Ponte', 'Bar O Cruceiro'],
  bakery: ['Padaria Pão do Caminho', 'Forno da Aldeia'],
} as const;

const CUISINES = ['Cozinha minhota', 'Cozinha galega', 'Polvo e marisco', 'Petiscos', 'Caseira', 'Vegetariana'];

export const restaurants: Restaurant[] = allStops.flatMap((stop) => {
  const rnd = seeded(hashString(`food-${stop.id}`));
  const kinds: Restaurant['kind'][] = ['cafe', 'restaurant', 'bakery'];
  if (rnd() > 0.5) kinds.push('bar');
  if (rnd() > 0.5) kinds.push('restaurant');
  return kinds.map((kind, i): Restaurant => {
    const id = `food-${stop.id}-${i}`;
    const avg = kind === 'restaurant' ? between(rnd, 10, 24) : between(rnd, 3, 9);
    const veg = rnd() > 0.4;
    return {
      id,
      name: pick(rnd, NAMES[kind]),
      kind,
      coord: [stop.coord[0] + between(rnd, -0.006, 0.006, 4), stop.coord[1] + between(rnd, -0.005, 0.005, 4)],
      stopId: stop.id,
      town: stop.name,
      distanceFromRouteKm: between(rnd, 0, 1.2, 1),
      accessible: rnd() > 0.5,
      review: { rating: between(rnd, 3.6, 4.9, 1), count: Math.round(between(rnd, 5, 1200)), ...demoProvenanceFrom('Avaliações') },
      sponsored: kind === 'cafe' && ['barcelos', 'tui', 'redondela', 'padron'].includes(stop.id) && i === 0 ? sponsoredPlacement('sp-2', id, 0.3) : undefined,
      partnerOffer: kind === 'cafe' && ['barcelos', 'tui', 'redondela', 'padron'].includes(stop.id) && i === 0 ? partnerOffer('sp-2', id) : undefined,
      provenance: demoProvenance,
      avgPrice: { amount: avg, currency: 'EUR', unit: 'per_meal', isEstimate: true, ...demoProvenanceFrom('Preços') },
      openingHours: kind === 'restaurant' ? '12:30–15:30 · 19:30–22:30' : kind === 'bakery' ? '07:00–14:00' : '07:30–20:00',
      cuisine: pick(rnd, CUISINES),
      pilgrimMenu: kind === 'restaurant' ? rnd() > 0.3 : false,
      diets: { vegetarian: veg, vegan: veg && rnd() > 0.5, glutenFree: rnd() > 0.6 },
      amenities: { waterRefill: rnd() > 0.3, toilet: kind !== 'bakery' || rnd() > 0.5, sockets: rnd() > 0.5, wifi: rnd() > 0.4, restArea: rnd() > 0.5 },
    };
  });
});
