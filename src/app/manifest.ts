import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Camino 3D · Copiloto do peregrino',
    short_name: 'Camino 3D',
    description: 'Planeje, navegue e viva o Caminho de Santiago.',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f1e8',
    theme_color: '#2f5d3a',
    lang: 'pt-BR',
    categories: ['travel', 'navigation', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcuts: [
      { name: 'Mapa', url: '/mapa' },
      { name: 'SOS', url: '/seguranca' },
      { name: 'Tradutor', url: '/tradutor' },
    ],
  };
}
