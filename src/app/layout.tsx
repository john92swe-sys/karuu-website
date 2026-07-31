import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteLayout } from '@/components/site-layout';

export const metadata: Metadata = {
  metadataBase: new URL('https://karuu.net'),
  title: {
    default: 'KARUU | Swedish B2B Activewear Sourcing Partner',
    template: '%s | KARUU',
  },
  description:
    'KARUU is a Swedish B2B activewear sourcing and manufacturing partner connecting global brands with selected manufacturing capabilities.',
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
    url: 'https://karuu.net',
    siteName: 'KARUU',
    title: 'KARUU | Swedish B2B Activewear Sourcing Partner',
    description:
      'Activewear sourcing, product development, OEM/ODM coordination, quality communication, and international service.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KARUU | Swedish B2B Activewear Sourcing Partner',
    description:
      'Activewear sourcing, product development, OEM/ODM coordination, and international service.',
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
