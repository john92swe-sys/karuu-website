import type { Metadata, Viewport } from 'next';
import './globals.css';
import './creative-store.css';
import { SiteLayout } from '@/components/site-layout';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.karuu.net'),
  title: {
    default: 'KARUU | Products for life. Stories to explore.',
    template: '%s | KARUU',
  },
  description:
    'Physical products and original digital creations from KARUU AB, Sweden. Women’s activewear, books, audio, music and games.',
  keywords: [
    'yoga wear wholesale',
    'activewear sourcing',
    'yoga apparel wholesale',
    'private label activewear',
    'activewear supplier',
    'product development',
    'OEM ODM coordination',
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
    index: process.env.VERCEL_ENV !== 'preview' && process.env.KARUU_DEPLOYMENT_ENV !== 'preview',
    follow: process.env.VERCEL_ENV !== 'preview' && process.env.KARUU_DEPLOYMENT_ENV !== 'preview',
    googleBot: {
      index: process.env.VERCEL_ENV !== 'preview' && process.env.KARUU_DEPLOYMENT_ENV !== 'preview',
      follow: process.env.VERCEL_ENV !== 'preview' && process.env.KARUU_DEPLOYMENT_ENV !== 'preview',
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.karuu.net',
    siteName: 'KARUU',
    title: 'KARUU | Products for life. Stories to explore.',
    description:
      'Physical products and original digital creations from KARUU AB, Sweden.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KARUU | Products for life. Stories to explore.',
    description:
      'Physical products and original digital creations from KARUU AB, Sweden.',
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F2F8FC',
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
