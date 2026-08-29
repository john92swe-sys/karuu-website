import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteLayout } from '@/components/site-layout';

export const metadata: Metadata = {
  metadataBase: new URL('https://karuu.net'),
  title: {
    default: 'KARUU | Women’s Activewear, Yoga & Fitness OEM/ODM Partner',
    template: '%s | KARUU',
  },
  description:
    'KARUU is a Swedish B2B women’s activewear, yoga, and fitness OEM/ODM and private-label product development partner.',
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
    title: 'KARUU | Women’s Activewear, Yoga & Fitness OEM/ODM Partner',
    description:
      'Activewear sourcing, product development, OEM/ODM coordination, quality communication, and international service.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KARUU | Women’s Activewear, Yoga & Fitness OEM/ODM Partner',
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
