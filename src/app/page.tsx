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
import {
  CollectionScenariosSection,
  MixedStyleMoqBanner,
} from '@/components/mixed-style-collection';
import { HYDRATION_PUBLICLY_DISCOVERABLE } from '@/config/catalog';

export const metadata: Metadata = {
  title: 'Women’s Activewear, Yoga & Fitness OEM/ODM Partner',
  description:
    'KARUU supports women’s activewear, yoga, and fitness brands with product development, sourcing, and OEM/ODM coordination. Start coordinated product series from 200 pieces, with styles mixable within the same series.',
  keywords:
    'activewear sourcing, yoga apparel wholesale, OEM ODM coordination, private label activewear, KARUU AB',
  openGraph: {
    title: 'KARUU | Women’s Activewear, Yoga & Fitness OEM/ODM Partner',
    description:
      'Women’s activewear, yoga, and fitness sourcing, product development, and OEM/ODM coordination. Starting MOQ: 200 pieces per product series, with styles mixable within the same series.',
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
      <MixedStyleMoqBanner />
      <CoreAdvantagesSection />
      <FeaturedCollectionSection />
      <CollectionScenariosSection />
      {HYDRATION_PUBLICLY_DISCOVERABLE && <HydrationCollectionSection />}
      <DocumentationSection />
      <PartnershipSection />
      <HomeContactSection />
    </>
  );
}
