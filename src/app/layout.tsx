import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteLayout } from '@/components/site-layout';

export const metadata: Metadata = {
  metadataBase: new URL('https://karuu.se'),
  title: {
    default: 'KARUU Yoga Apparel | Premium Yoga Wear Wholesaler — Nordic Design',
    template: '%s | KARUU Yoga Apparel',
  },
  description:
    'KARUU AB — premium yoga apparel manufacturer and wholesaler. OEKO-TEX certified leggings, sports bras, tops and outerwear. Nordic design, bulk supply, OEM/ODM service.',
  keywords: [
    'yoga wear wholesale',
    'yoga apparel manufacturer',
    'yoga leggings bulk',
    'sports bra OEM',
    'activewear supplier',
    'nordic yoga brand',
    'eco friendly activewear',
    'OEKO-TEX yoga wear',
    'KARUU AB',
  ],
  authors: [{ name: 'KARUU AB' }],
  creator: 'KARUU AB',
  publisher: 'KARUU AB',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://karuu.se',
    siteName: 'KARUU Yoga Apparel',
    title: 'KARUU Yoga Apparel | Premium Yoga Wear Wholesaler',
    description:
      'Premium yoga apparel manufacturer and wholesaler. OEKO-TEX certified leggings, sports bras, tops and outerwear.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'KARUU Yoga Apparel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KARUU Yoga Apparel | Premium Yoga Wear Wholesaler',
    description:
      'Premium yoga apparel manufacturer and wholesaler. OEKO-TEX certified.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1A3A5C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
