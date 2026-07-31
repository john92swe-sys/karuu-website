import type { Metadata } from 'next';
import {
  HeroSection,
  CoreAdvantagesSection,
  FeaturedCollectionSection,
  DocumentationSection,
  PartnershipSection,
  HomeContactSection,
} from '@/components/sections/home-sections';

export const metadata: Metadata = {
  title: 'Swedish B2B Activewear Sourcing Partner',
  description:
    'KARUU connects global activewear brands with selected manufacturing capabilities through sourcing, product development, OEM/ODM coordination, and international service.',
  keywords:
    'activewear sourcing, yoga apparel wholesale, OEM ODM coordination, private label activewear, KARUU AB',
  openGraph: {
    title: 'KARUU | Swedish B2B Activewear Sourcing Partner',
    description:
      'Sourcing, product development, OEM/ODM coordination, quality communication, and international service.',
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
      <DocumentationSection />
      <PartnershipSection />
      <HomeContactSection />
    </>
  );
}
