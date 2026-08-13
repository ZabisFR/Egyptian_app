import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Geist } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SITE } from '@/lib/site-config';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Garamond : la lettre d'édition française. Elle porte les titres pendant que les motifs
// égyptiens restent cantonnés à l'ornement — l'inverse donnerait une affiche de péplum.
//
// Une seule graisse : `.display` n'utilise que le 600. Charger aussi le 500 et le 700
// revenait à télécharger deux fichiers que rien n'affiche.
const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600'],
});

const DESCRIPTION =
  "Apprendre l'arabe égyptien du Caire, module par module : alphabet, Arabizi, grammaire et conjugaison, de A1 à B2.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Arabe égyptien',
    // Les pages internes deviennent « Modules — Arabe égyptien » sans avoir à répéter
    // le suffixe dans chaque fichier.
    template: '%s — Arabe égyptien',
  },
  description: DESCRIPTION,
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
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE.url,
    siteName: 'Arabe égyptien',
    title: 'Arabe égyptien — parler le dialecte du Caire',
    description: DESCRIPTION,
    images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary',
    title: 'Arabe égyptien — parler le dialecte du Caire',
    description: DESCRIPTION,
    images: ['/icons/icon-512x512.png'],
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
      className={`${geistSans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          Lien d'évitement : au clavier, il évite de retraverser toute la navigation à
          chaque page. Invisible tant qu'il n'a pas le focus, il apparaît au premier Tab.
        */}
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        <Navbar />
        <div id="contenu" className="flex flex-1 flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
