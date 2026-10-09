import type { Affiliate, CreatorRoute } from '@/lib/domain/types';

// Afiliados e criadores FICTÍCIOS. Nenhum nome real é usado sem autorização por escrito.
export const demoAffiliates: Affiliate[] = [
  { id: 'aff-ana', name: 'Ana Caminhante (criadora fictícia)', channel: 'youtube', code: 'ANACAMINHA', commissionRate: 0.25, status: 'active', nameUseAuthorized: true, stats: { clicks: 4120, checkouts: 610, sales: 312 }, isDemo: true },
  { id: 'aff-trilhas', name: 'Trilhas & Pão (canal fictício)', channel: 'instagram', code: 'TRILHASPAO', commissionRate: 0.2, status: 'active', nameUseAuthorized: false, stats: { clicks: 1980, checkouts: 240, sales: 101 }, isDemo: true },
  { id: 'aff-rotanorte', name: 'Agência Rota Norte (fictícia)', channel: 'agency', code: 'ROTANORTE', commissionRate: 0.15, status: 'pending', nameUseAuthorized: false, stats: { clicks: 0, checkouts: 0, sales: 0 }, isDemo: true },
];

export const demoCreatorRoutes: CreatorRoute[] = [
  {
    id: 'caminho-da-ana',
    affiliateId: 'aff-ana',
    title: 'O Caminho da Ana',
    baseRouteId: 'central',
    summary: 'Versão tranquila do Caminho Central, com paradas mais curtas, cafés para pausa e as pontes mais bonitas. Exemplo fictício do formato de rota de criador.',
    tips: [
      { stopId: 'porto', text: 'Saia cedo da Sé para cruzar a cidade antes do trânsito. Carimbe a credencial na catedral.' },
      { stopId: 'barcelos', text: 'Na quinta tem feira semanal. Vale chegar antes do almoço.' },
      { stopId: 'pontedelima', text: 'Durma aqui e atravesse a ponte medieval ao entardecer. A subida da Labruja é no dia seguinte: saia às 7h.' },
      { stopId: 'tui', text: 'A catedral-fortaleza é a minha favorita. Lembre que a Espanha está uma hora à frente.' },
      { stopId: 'pontevedra', text: 'Tire uma tarde livre para o centro histórico e a capela da Peregrina.' },
      { stopId: 'padron', text: 'Prove os pimentos de Padrón e visite a pedra do Pedrón na igreja de Santiago.' },
    ],
    isDemo: true,
  },
];

export function affiliateByCode(code: string): Affiliate | undefined {
  const c = code.trim().toUpperCase();
  return demoAffiliates.find((a) => a.code === c && a.status === 'active');
}

export function creatorRoute(id: string): CreatorRoute | undefined {
  return demoCreatorRoutes.find((r) => r.id === id);
}
