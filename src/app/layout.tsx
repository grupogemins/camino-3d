import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible } from 'next/font/google';
import { ClientBoot } from '@/components/layout/ClientBoot';
import './globals.css';

const legible = Atkinson_Hyperlegible({ subsets: ['latin', 'latin-ext'], weight: ['400', '700'], variable: '--font-legible', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Camino 3D · Copiloto do peregrino', template: '%s · Camino 3D' },
  description: 'Planejamento, navegação, hospedagem, clima, tradução, segurança e comunidade para o Caminho de Santiago.',
  applicationName: 'Camino 3D',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Camino 3D', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2f5d3a' },
    { media: '(prefers-color-scheme: dark)', color: '#121614' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={legible.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <ClientBoot />
        {children}
      </body>
    </html>
  );
}
