import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import { ClientBoot } from '@/components/layout/ClientBoot';
import './globals.css';

const legible = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-legible', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin', 'latin-ext'], variable: '--font-fraunces', display: 'swap', axes: ['SOFT', 'WONK', 'opsz'] });

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
    { media: '(prefers-color-scheme: light)', color: '#f3ebdb' },
    { media: '(prefers-color-scheme: dark)', color: '#13110e' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${legible.variable} ${fraunces.variable}`} suppressHydrationWarning>
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
