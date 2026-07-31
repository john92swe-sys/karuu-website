import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import RfqForm from '@/components/rfq-form';
import { getAllProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Request a B2B Activewear Quote',
  description: 'Prepare a detailed RFQ for KARUU activewear sourcing, private-label production, packaging, and international delivery requirements.',
  alternates: { canonical: '/rfq' },
  openGraph: {
    title: 'Request a B2B Activewear Quote | KARUU',
    description: 'Prepare product, branding, packaging, trade, and delivery requirements for a tailored KARUU quotation.',
    url: '/rfq',
  },
};

export default function RfqPage() {
  const products = getAllProducts().map(({ sku, name }) => ({ sku, name }));

  return (
    <main className="bg-bg-alt pb-20 pt-12">
      <div className="container mx-auto max-w-7xl px-5 md:px-6">
        <Breadcrumb items={[{ label: 'Request a Quote' }]} />
        <header className="mb-10 mt-8 max-w-3xl">
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-secondary">B2B inquiry</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary md:text-5xl">Request a tailored quotation</h1>
          <p className="mt-5 text-base leading-relaxed text-stone-light md:text-lg">Build a clear sourcing brief for our team. Add your company, product, customization, and trade requirements, then review the live inquiry summary.</p>
        </header>
        <RfqForm products={products} />
      </div>
    </main>
  );
}
