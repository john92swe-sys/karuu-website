import type { Metadata } from 'next';
import {
  HeroSection,
  CoreAdvantagesSection,
  FeaturedCollectionSection,
  OekotexSection,
  TestimonialsSection,
  HomeContactSection,
} from '@/components/sections/home-sections';

export const metadata: Metadata = {
  title: 'KARUU | Premium Yoga Apparel — Scandinavian Design, OEKO-TEX Certified',
  description:
    'KARUU AB — Nordic premium yoga apparel manufacturer. OEKO-TEX certified fabrics, OEM/ODM services, and global wholesale distribution. Designed in Scandinavia, crafted for performance.',
  keywords:
    'yoga apparel, yoga leggings, sports bra, yoga wear manufacturer, OEKO-TEX yoga, wholesale yoga clothing, Nordic yoga brand, KARUU AB',
  openGraph: {
    title: 'KARUU | Premium Yoga Apparel',
    description:
      'Nordic premium yoga apparel manufacturer. OEKO-TEX certified fabrics with OEM/ODM services.',
    type: 'website',
    locale: 'en_US',
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CoreAdvantagesSection />
      <FeaturedCollectionSection />
      <OekotexSection />
      <TestimonialsSection />
      <HomeContactSection />
    </>
  );
}
