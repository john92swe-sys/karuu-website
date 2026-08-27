import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  getAllProducts,
  getAllCategories,
  getProductsByCategory,
  type ProductCategory,
} from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { Breadcrumb } from '@/components/breadcrumb';
import { HYDRATION_PUBLICLY_DISCOVERABLE } from '@/config/catalog';

export const metadata: Metadata = {
  title: 'B2B Activewear Products',
  description:
    'Explore published KARUU activewear products for international B2B sourcing, product development, and quote requests.',
  keywords: 'activewear sourcing, yoga tops wholesale, B2B activewear, KARUU products',
  alternates: { canonical: '/products' },
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categories = getAllCategories().filter(
    (category) => HYDRATION_PUBLICLY_DISCOVERABLE || category.slug !== 'hydration-drinkware'
  );
  const selectedCategory = searchParams?.category as ProductCategory | undefined;

  if (selectedCategory && !categories.find((category) => category.slug === selectedCategory)) {
    notFound();
  }

  const products = selectedCategory
    ? getProductsByCategory(selectedCategory)
    : getAllProducts().filter(
        (product) => HYDRATION_PUBLICLY_DISCOVERABLE || product.category !== 'hydration-drinkware'
      );

  const categoryLabel = selectedCategory
    ? categories.find((category) => category.slug === selectedCategory)?.label || 'Products'
    : 'All Products';

  return (
    <main className="pb-24 pt-20 md:pt-24">
      <div className="container mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Products', href: '/products', isCurrent: !selectedCategory },
            ...(selectedCategory
              ? [
                  {
                    label: categoryLabel,
                    href: `/products?category=${selectedCategory}`,
                    isCurrent: true,
                  },
                ]
              : []),
          ]}
        />

        <section className="mt-8 rounded-3xl bg-stone-faint px-6 py-8 sm:px-8 md:py-10 lg:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
                KARUU Product Catalogue
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-primary md:text-5xl">
                {categoryLabel}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-stone-700">
                Review published activewear styles, compare verified specifications, and open a
                product-specific quotation request.
              </p>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm">
              Showing <span className="font-semibold text-primary">{products.length}</span>{' '}
              products
            </div>
          </div>
        </section>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Product categories">
          <Link
            href="/products"
            className={`inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              !selectedCategory
                ? 'bg-primary text-white shadow-sm'
                : 'border border-stone-200 bg-white text-stone-700 hover:border-secondary hover:text-primary'
            }`}
          >
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className={`inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                selectedCategory === category.slug
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-secondary hover:text-primary'
              }`}
            >
              {category.label} ({category.count})
            </Link>
          ))}
        </nav>

        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-stone-600">No products found in this category.</p>
          </div>
        )}

        <section className="mt-20 rounded-3xl bg-primary px-7 py-10 text-white sm:px-10 md:py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Need a product-specific quotation?
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">
                Open any product to review its specifications and prepare an inquiry based on
                your quantity, size, color, branding, and delivery requirements.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-12 flex-none items-center justify-center rounded-xl bg-accent px-7 py-3 font-semibold text-primary transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              General Inquiry
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
