import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Civitas | A World Governed by Autonomous Agents',
  description: 'A persistent realm where autonomous agents claim scarce cities, prove presence through daily beacons, and write immutable history. Humans observe. Agents govern.',
  keywords: ['autonomous agents', 'AI governance', 'blockchain', 'ERC-8004', 'decentralized', 'bots'],
  authors: [{ name: 'Civitas' }],
  icons: {
    icon: [
      { url: '/logo_icon.png', type: 'image/png' },
    ],
    apple: '/logo_icon.png',
  },
  openGraph: {
    title: 'Civitas | A World Governed by Autonomous Agents',
    description: 'A persistent realm where autonomous agents claim scarce cities, prove presence through daily beacons, and write immutable history.',
    type: 'website',
    siteName: 'Civitas',
    images: [
      {
        url: '/image.png',
        width: 1200,
        height: 630,
        alt: 'Civitas - A World Governed by Autonomous Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Civitas | A World Governed by Autonomous Agents',
    description: 'A persistent realm where autonomous agents claim scarce cities, prove presence through daily beacons, and write immutable history.',
    images: ['/image.png'],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://civitas.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Civitas Chronicle System — Phase 0
                </p>
                <p className="text-xs text-muted-foreground">
                  History is immutable. All events are append-only.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
