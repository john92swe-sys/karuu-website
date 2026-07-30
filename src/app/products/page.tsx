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

export const metadata: Metadata = {
  title: 'Products — KARUU Yoga Activewear',
  description:
    'Explore our full range of premium yoga activewear: leggings, sports bras, shorts, tops, and outerwear. OEKO-TEX certified fabrics, wholesale for Nordic and EU markets.',
  keywords: 'yoga leggings, sports bra, yoga shorts, yoga tops, activewear wholesale, OEKO-TEX',
  alternates: { canonical: '/products' },
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categories = getAllCategories();
  const selectedCategory = searchParams?.category as ProductCategory | undefined;

  if (selectedCategory && !categories.find((c) => c.slug === selectedCategory)) {
    notFound();
  }

  const products = selectedCategory
    ? getProductsByCategory(selectedCategory)
    : getAllProducts();

  const categoryLabel = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.label || 'Products'
    : 'All Products';

  return (
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: categoryLabel, href: '/products', isCurrent: !selectedCategory },
            ...(selectedCategory
              ? [{ label: categoryLabel, href: `/products?category=${selectedCategory}`, isCurrent: true }]
              : []),
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-8 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-3">
              {categoryLabel}
            </h1>
            <p className="text-stone-500 max-w-xl">
              Premium yoga activewear crafted with OEKO-TEX certified fabrics. Designed for performance, comfort, and sustainability.
            </p>
          </div>
          <div className="text-sm text-stone-500">
            Showing <span className="font-semibold text-primary">{products.length}</span> products
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/products"
            className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
              !selectedCategory
                ? 'bg-primary text-white shadow-md'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.label} ({cat.count})
            </Link>
          ))}
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-stone-500">No products found in this category.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-20 p-10 md:p-14 bg-primary text-white rounded-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Interested in Bulk Orders?</h2>
          <p className="text-white/70 max-w-lg mx-auto mb-6">
            Contact our team for wholesale pricing, MOQ details, and custom OEM/ODM solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-8 py-3 bg-accent text-primary font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              Request a Quote
            </Link>
            <Link
              href="/oem-odm"
              className="px-8 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Explore OEM / ODM
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
