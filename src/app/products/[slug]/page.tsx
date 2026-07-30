import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle, ArrowRight, Award, CheckCircle, Factory, Leaf, ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { ProductGallery } from '@/components/product-gallery';
import {
  getProductBySlug,
  getAllProducts,
  getProductImagePaths,
  type Product,
} from '@/lib/products';

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  const products = getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: 'Product Not Found | KARUU' };

  const ogImages = getProductImagePaths(product.sku, product.imageCount).slice(0, 1).map((url) => ({
    url,
    width: 1200,
    height: 1600,
    alt: product.name,
  }));

  return {
    title: `${product.name} | ${product.sku} | KARUU Yoga Apparel`,
    description: `${product.shortDescription} OEKO-TEX certified premium yoga wear.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | KARUU`,
      description: product.shortDescription,
      images: ogImages,
      type: 'website',
    },
  };
}

// Schema.org Product structured data
function ProductJsonLd({ product }: { product: Product }) {
  const images = getProductImagePaths(product.sku, product.imageCount);
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.shortDescription,
    image: images,
    brand: { '@type': 'Brand', name: 'KARUU' },
    material: product.fabric,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const imagePaths = getProductImagePaths(product.sku, product.imageCount);

  return (
    <div className="container mx-auto px-6 py-12">
      <ProductJsonLd product={product} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Products', href: '/products' },
          { label: product.categoryLabel, href: '/products' },
          { label: product.name },
        ]}
      />

      {/* Main Product Section */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mt-8 mb-20">
        {/* Gallery */}
        <div>
          <ProductGallery images={imagePaths} alt={product.name} />
        </div>

        {/* Info */}
        <div>
          <div className="text-xs text-stone-lighter font-mono mb-2">
            {product.sku}
          </div>
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">
            {product.categoryLabel}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-primary mt-2 mb-4">
            {product.name}
          </h1>
          <p className="text-stone-light mb-6">{product.description}</p>

          {/* Quick badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              OEKO-TEX Certified
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-faint text-stone rounded-full text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5" />
              Eco-Friendly
            </div>
            {product.featured && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-primary rounded-full text-xs font-bold">
                BEST SELLER
              </div>
            )}
          </div>

          {/* Fabric Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary mb-4">Fabric Specifications</h2>
            <div className="border border-stone-lighter rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-stone-lighter">
                    <td className="px-4 py-3 bg-stone-faint font-semibold text-primary w-1/3">
                      Fabric
                    </td>
                    <td className="px-4 py-3 text-stone">{product.fabric}</td>
                  </tr>
                  <tr className="border-b border-stone-lighter">
                    <td className="px-4 py-3 bg-stone-faint font-semibold text-primary">
                      Composition
                    </td>
                    <td className="px-4 py-3 text-stone">{product.composition}</td>
                  </tr>
                  <tr className="border-b border-stone-lighter">
                    <td className="px-4 py-3 bg-stone-faint font-semibold text-primary">
                      Weight
                    </td>
                    <td className="px-4 py-3 text-stone">{product.weight}</td>
                  </tr>
                  <tr className="border-b border-stone-lighter">
                    <td className="px-4 py-3 bg-stone-faint font-semibold text-primary">
                      Sizes
                    </td>
                    <td className="px-4 py-3 text-stone">{product.sizes.join(' / ')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 bg-stone-faint font-semibold text-primary">
                      Available Colors
                    </td>
                    <td className="px-4 py-3 text-stone">
                      {product.colors.map((c) => c.name).join(', ')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <a
              href="https://wa.me/46708802017"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-[#20ba57] transition-all hover:-translate-y-0.5 flex-1"
            >
              <MessageCircle className="w-5 h-5" />
              Inquire on WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-primary-light transition-all hover:-translate-y-0.5 flex-1"
            >
              Request Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-stone-lighter text-center">
            MOQ {product.moq} · Custom designs available · Sample on request
          </p>
        </div>
      </div>

      {/* Features */}
      <section className="mb-20">
        <div className="text-center mb-10">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            Why This Product
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mt-3">
            Key Features
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {product.features.map((feature: string, i: number) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white border border-stone-lighter hover:border-secondary/30 hover:shadow-lg transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-stone font-medium">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OEM + Certifications */}
      <section className="grid md:grid-cols-2 gap-6 mb-20">
        <div className="bg-stone-faint rounded-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-white text-secondary flex items-center justify-center shadow-sm mb-4">
            <Factory className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">OEM / ODM Available</h3>
          <p className="text-stone-light mb-4">
            Fully customize this product with your brand logo, custom colors,
            modified designs, and private labeling. Low MOQ starting from 100 pcs.
          </p>
          <ul className="space-y-2 mb-6">
            {product.oemOptions.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-stone">
                <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
          <Link
            href="/oem-odm"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:text-secondary transition-colors group"
          >
            Learn more about OEM/ODM
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-primary rounded-2xl p-8 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/10 text-accent flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Certified Quality</h3>
          <p className="text-white/70 mb-4">
            Every product is tested against international standards to ensure safety,
            durability, and compliance with EU regulations.
          </p>
          <ul className="space-y-2 mb-6">
            {product.certifications.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
          <Link
            href="/quality-certifications"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:text-accent-light transition-colors group"
          >
            View all certifications
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
