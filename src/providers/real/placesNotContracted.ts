/**
 * Ponto de entrada para hospedagens/restaurantes REAIS.
 * NÃO há integração ativa: Google Places (API oficial) e programas de afiliados de hospedagem
 * exigem contrato/chave. Este provedor falha explicitamente para nunca fingir dados ao vivo.
 * Proibido: scraping de Google Maps, Booking.com ou similares.
 */
import { ProviderNotConfiguredError, type PlacesProvider } from '../types';

export function createGooglePlacesProvider(apiKey = process.env.GOOGLE_PLACES_API_KEY): PlacesProvider {
  const fail = async (): Promise<never> => {
    if (!apiKey) throw new ProviderNotConfiguredError('Google Places', 'GOOGLE_PLACES_API_KEY');
    throw new Error('Integração Google Places ainda não implementada: ver docs/07-substituir-mocks.md');
  };
  return {
    id: 'google-places',
    listAccommodations: fail,
    getAccommodation: fail,
    listRestaurants: fail,
    listPointsOfInterest: fail,
  };
}
