import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Garamond : la lettre d'édition française. Elle porte les titres pendant que les motifs
// égyptiens restent cantonnés à l'ornement — l'inverse donnerait une affiche de péplum.
const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Arabe égyptien',
  description: "Apprendre l'arabe égyptien du Caire, module par module.",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-180x180.png', sizes: '180x180' },
      { url: '/icons/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/apple-icon-167x167.png', sizes: '167x167' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    // Nom affiché sous l'icône sur l'écran d'accueil : plus court que le titre de la
    // page pour ne pas être tronqué.
    title: '3arabi',
  },
};

// Next.js exige un export `viewport` séparé pour themeColor depuis la v14 — le mettre
// dans `metadata` produit un avertissement de dépréciation.
export const viewport: Viewport = {
  themeColor: '#1B2A4A',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
