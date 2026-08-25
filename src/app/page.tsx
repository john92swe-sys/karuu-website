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

export const metadata: Metadata = {
  title: 'Nordic B2B Active Lifestyle Product Development Partner',
  description:
    'KARUU supports activewear brands with product development, sourcing, OEM/ODM coordination, and an adjacent hydration and drinkware collection.',
  keywords:
    'activewear sourcing, yoga apparel wholesale, OEM ODM coordination, private label activewear, KARUU AB',
  openGraph: {
    title: 'KARUU | Nordic B2B Active Lifestyle Product Development Partner',
    description:
      'Activewear-led sourcing, product development, OEM/ODM coordination, and adjacent hydration products.',
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
      <HydrationCollectionSection />
      <DocumentationSection />
      <PartnershipSection />
      <HomeContactSection />
    </>
  );
}
