import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, PackageCheck, Palette, SearchCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { ProductCard } from '@/components/product-card';
import { getProductsByCategory } from '@/lib/products';

export const metadata: Metadata = {
  title: { absolute: 'Custom Water Bottles & Drinkware | Private Label | KARUU' },
  description: 'Explore custom water bottles and branded hydration products for activewear, fitness, yoga, and wellness brands. Request samples and OEM/private-label quotes from KARUU.',
  keywords: ['custom water bottles for brands', 'private label water bottles', 'OEM drinkware', 'branded hydration products', 'custom bottles for fitness brands'],
  alternates: { canonical: 'https://karuu.net/products/hydration-drinkware' },
  openGraph: {
    title: 'Custom Water Bottles & Drinkware | Private Label | KARUU',
    description: 'Hydration products for activewear, fitness, yoga, and wellness collections.',
    url: 'https://karuu.net/products/hydration-drinkware',
    type: 'website',
  },
};

const faq = [
  ['Can KARUU coordinate private-label hydration projects?', 'Yes. KARUU can review product selection, branding requirements, sampling, packaging, and quotation needs. The exact available methods are confirmed for the selected product.'],
  ['What is the minimum order quantity?', 'MOQ is confirmed during inquiry review because it varies by product, color, branding method, and packaging requirement. No unverified MOQ is published on this page.'],
  ['Can I request a sample before placing an order?', 'Yes. Use the product-specific inquiry form and select Sample request. Sample availability, cost, and timing are confirmed after the product and branding brief are reviewed.'],
  ['Can hydration products be developed with an activewear range?', 'Yes. KARUU positions hydration as an adjacent product pillar for activewear, yoga, fitness, and wellness brands, allowing both categories to be coordinated through one collection brief.'],
];

export default function HydrationCollectionPage() {
  const products = getProductsByCategory('hydration-drinkware');
  const breadcrumbData = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://karuu.net' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://karuu.net/products' },
      { '@type': 'ListItem', position: 3, name: 'Hydration & Drinkware', item: 'https://karuu.net/products/hydration-drinkware' },
    ],
  };
  const faqData = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  };

  return (
    <main className="pb-24 pt-20 md:pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      <div className="container mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Products', href: '/products' }, { label: 'Hydration & Drinkware' }]} />

        <section className="mt-8 overflow-hidden rounded-3xl bg-primary px-7 py-12 text-white sm:px-10 md:py-16 lg:px-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Hydration & Drinkware</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl">
            Custom Water Bottles for Activewear, Fitness & Wellness Brands
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/78">
            Extend your activewear collection with B2B hydration products selected for fitness, yoga, wellness, commute, brand events, and retail programs. KARUU coordinates product review, samples, branding requirements, and quotation steps without publishing unconfirmed commercial claims.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#collection" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-7 py-3.5 font-semibold text-primary">Explore the Collection</a>
            <Link href="/contact?interest=hydration-sample" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-7 py-3.5 font-semibold text-white">Request Sample</Link>
            <Link href="/contact?interest=hydration-quote" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-7 py-3.5 font-semibold text-white">Request Quote</Link>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {['Yoga', 'Fitness', 'Wellness', 'Commute', 'Brand Events', 'Retail Programs'].map((use) => (
              <div key={use} className="rounded-2xl border border-stone-200 bg-white p-6">
                <CheckCircle2 className="h-6 w-6 text-secondary" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold text-primary">{use}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-700">Product selection and project requirements aligned to the intended use and target market.</p>
              </div>
            ))}
          </div>
        </section>

        <section id="collection" className="scroll-mt-24 rounded-3xl bg-stone-faint px-5 py-12 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">Verified Product Selection</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-primary md:text-4xl">Hydration products ready for buyer review</h2>
              <p className="mt-4 max-w-3xl leading-7 text-stone-700">Only products with source-backed core specifications and clean public images are shown. Missing MOQ, lead time, certification, and performance values are confirmed during inquiry.</p>
            </div>
            <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">{products.length} products</p>
          </div>
          <div className="mt-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => <ProductCard key={product.sku} product={product} />)}
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              [SearchCheck, '1. Select', 'Choose a documented product format and share your market, intended use, and initial quantity.'],
              [Palette, '2. Develop', 'Review project-specific color, branding, packaging, and sample requirements.'],
              [PackageCheck, '3. Confirm', 'Confirm the approved sample, quotation, production terms, and delivery plan before ordering.'],
            ].map(([Icon, title, text]) => {
              const StepIcon = Icon as typeof SearchCheck;
              return <div key={title as string} className="rounded-2xl border border-stone-200 p-7"><StepIcon className="h-7 w-7 text-secondary" /><h2 className="mt-4 text-xl font-semibold text-primary">{title as string}</h2><p className="mt-3 leading-7 text-stone-700">{text as string}</p></div>;
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-primary px-7 py-12 text-white sm:px-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Activewear + Hydration</p><h2 className="mt-3 text-3xl font-bold text-white">Build the complete active lifestyle collection</h2><p className="mt-4 max-w-2xl leading-7 text-white/75">Coordinate activewear development and adjacent hydration products through one Swedish B2B contact point.</p></div>
            <div className="flex flex-col gap-3"><Link href="/products" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-primary">Explore Activewear</Link><Link href="/contact?interest=activewear-hydration" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 font-semibold text-white">Build Your Collection</Link></div>
          </div>
        </section>

        <section className="py-16 md:py-20"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">FAQ</p><h2 className="mt-3 text-3xl font-bold text-primary">Hydration project questions</h2><div className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white px-6">{faq.map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer font-semibold text-primary">{question}</summary><p className="mt-3 max-w-4xl leading-7 text-stone-700">{answer}</p></details>)}</div></section>
      </div>
    </main>
  );
}
