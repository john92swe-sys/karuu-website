import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { RfqForm } from '@/components/rfq-form';
import { getAllProducts, getProductBySlug } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Request a Quote',
  description: 'Request a tailored KARUU B2B activewear quotation.',
  alternates: { canonical: '/rfq' },
};

export default function RfqPage({ searchParams }: { searchParams: { product?: string } }) {
  const requestedProduct = searchParams.product ? getProductBySlug(searchParams.product) : undefined;

  return (
    <main className="pb-20 pt-28">
      <div className="container mx-auto max-w-7xl px-5 sm:px-6">
        <Breadcrumb items={[{ label: 'Request Quote' }]} />
        <header className="mb-10 mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Request Quote</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            {requestedProduct?.name || 'Tell us what you need'}
          </h1>
          {requestedProduct ? (
            <p className="mt-4 text-lg text-stone-600">SKU <span className="font-mono font-semibold text-primary">{requestedProduct.sku}</span></p>
          ) : (
            <p className="mt-4 text-lg leading-8 text-stone-600">Select a product and share your quantity and customization requirements.</p>
          )}
        </header>
        <RfqForm products={getAllProducts()} initialProductSlug={requestedProduct?.slug} />
      </div>
    </main>
  );
}
