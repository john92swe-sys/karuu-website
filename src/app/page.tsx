import type { Metadata } from 'next';
import {
  HeroSection,
  CoreAdvantagesSection,
  FeaturedCollectionSection,
  HydrationCollectionSection,
  DocumentationSection,
  PartnershipSection,
  HomeContactSection,
} from '@/components/sections/home-sections';
import { HYDRATION_PUBLICLY_DISCOVERABLE } from '@/config/catalog';

export const metadata: Metadata = {
  title: 'Nordic B2B Active Lifestyle Product Development Partner',
  description:
    'KARUU supports women’s activewear, yoga, and fitness brands with product development, sourcing, and OEM/ODM coordination.',
  keywords:
    'activewear sourcing, yoga apparel wholesale, OEM ODM coordination, private label activewear, KARUU AB',
  openGraph: {
    title: 'KARUU | Nordic B2B Active Lifestyle Product Development Partner',
    description:
      'Women’s activewear, yoga, and fitness sourcing, product development, and OEM/ODM coordination.',
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
      {HYDRATION_PUBLICLY_DISCOVERABLE && <HydrationCollectionSection />}
      <DocumentationSection />
      <PartnershipSection />
      <HomeContactSection />
    </>
  );
}
