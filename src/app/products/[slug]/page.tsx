import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  MessageCircle,
  Palette,
  SearchCheck,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { ProductGallery } from '@/components/product-gallery';
import { ProductInquiryForm } from '@/components/product-inquiry-form';
import { getAllProducts, getProductBySlug, type Product } from '@/lib/products';
import { formatProductMetadataTitle } from '@/lib/product-metadata-title.mjs';

interface PageProps {
  params: { slug: string };
}

const siteUrl = 'https://karuu.net';

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: { absolute: 'Product Not Found | KARUU' } };

  const mainImage = product.gallery[0];
  const pageTitle = formatProductMetadataTitle(product.seo.title);

  return {
    title: { absolute: pageTitle },
    description: product.seo.description,
    alternates: { canonical: product.seo.canonical },
    openGraph: {
      title: pageTitle,
      description: product.seo.description,
      url: product.seo.canonical,
      type: 'website',
      images: [
        {
          url: mainImage.src,
          width: mainImage.width,
          height: mainImage.height,
          alt: mainImage.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: product.seo.description,
      images: [mainImage.src],
    },
  };
}

function StructuredData({ product }: { product: Product }) {
  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteUrl}/products/${product.slug}#product`,
    name: product.name,
    sku: product.sku,
    url: `${siteUrl}/products/${product.slug}`,
    description: product.shortDescription,
    image: product.gallery.map((image) => `${siteUrl}${image.src}`),
    ...(product.category !== 'hydration-drinkware'
      ? { brand: { '@type': 'Brand', name: 'KARUU' } }
      : {}),
    category: product.categoryPath.join(' > '),
    material: product.material,
    ...(product.colors.length
      ? { color: product.colors.map((color) => color.name).join(', ') }
      : {}),
    size: product.sizes.join(', '),
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${siteUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${siteUrl}/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const standardDetails = [
    ['Material', product.material],
    ['Fit', product.fit],
    ['Neckline', product.neckline],
    ['Sleeve', product.sleeve],
    ['Sizes', product.sizes.join(' / ')],
    ['MOQ', product.moq],
    ['Packaging', product.packaging],
    ['Sample time', product.sampleTime],
    ['Lead time', product.leadTime],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const details = product.specifications?.length
    ? product.specifications.map((item) => [item.label, item.value] as [string, string])
    : standardDetails;

  return (
    <dl className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {details.map(([label, value], index) => (
        <div
          key={label}
          className={`grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-6 ${
            index < details.length - 1 ? 'border-b border-stone-200' : ''
          }`}
        >
          <dt className="font-semibold text-primary">{label}</dt>
          <dd className="leading-7 text-stone-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const whatsappMessage = encodeURIComponent(
    `Hello KARUU, I would like to inquire about ${product.name} (${product.sku}).`
  );
  const whatsappUrl = `https://wa.me/46708802017?text=${whatsappMessage}`;
  const procurementSummary = [
    ['Material', product.material],
    [product.category === 'hydration-drinkware' ? 'Capacity' : 'Sizes', product.sizes.join(' / ')],
    ['MOQ', product.moq],
    ['Packaging', product.packaging],
    ['Fit', product.fit],
    ['Customization', product.customization[0] || 'Project-based review'],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const relatedProducts = product.relatedProducts
    .map((slug) => getProductBySlug(slug))
    .filter((item): item is Product => Boolean(item));

  return (
    <main className="overflow-x-clip pb-24 pt-20 md:pt-24">
      <StructuredData product={product} />

      <div className="container mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Products', href: '/products' },
            { label: product.shortName },
          ]}
        />

        <section className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:gap-14">
          <ProductGallery images={product.gallery} colors={[]} />

          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
              {product.categoryPath.join(' / ')}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-primary lg:text-[2.75rem]">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-primary-50 px-3 py-1.5 font-semibold text-primary">
                KARUU SKU {product.sku}
              </span>
            </div>

            <p className="mt-6 text-[17px] leading-8 text-stone-700">{product.shortDescription}</p>

            <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                Buyer specification snapshot
              </p>
              <dl className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                {procurementSummary.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold leading-6 text-primary">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-5 rounded-xl bg-stone-faint px-4 py-3 text-sm leading-6 text-stone-700">
              Commercial terms, samples, and production arrangements are confirmed based on the
              individual product and project.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href="#inquiry"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              >
                Request a Quote
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              {product.category === 'hydration-drinkware' && (
                <a
                  href="#inquiry"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-6 py-3.5 font-semibold text-primary transition-colors hover:border-secondary hover:bg-stone-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                >
                  Request a Sample
                </a>
              )}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#168a45]/25 bg-white px-6 py-3.5 font-semibold text-[#126f39] transition-colors hover:bg-[#168a45]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {product.category === 'hydration-drinkware' && (
          <section className="border-t border-stone-200 py-16 md:py-20">
            <div className="grid gap-8 rounded-3xl bg-primary px-7 py-10 text-white md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                  Pair with Your Activewear Collection
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white">Build a coordinated active lifestyle range</h2>
                <p className="mt-4 max-w-2xl leading-7 text-white/75">
                  Combine branded hydration with yoga, fitness, and activewear development through one KARUU project brief.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link href="/products" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-primary">
                  Explore Activewear
                </Link>
                <Link href="/contact?interest=activewear-hydration" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 font-semibold text-white">
                  Build Your Collection
                </Link>
              </div>
            </div>
          </section>
        )}

        {relatedProducts.length > 0 && (
          <section className="border-t border-stone-200 py-16 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Related Products</p>
            <h2 className="mt-3 text-3xl font-bold text-primary">More hydration options</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((item) => (
                <Link key={item.sku} href={`/products/${item.slug}`} className="rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-secondary hover:shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">{item.sku}</p>
                  <h3 className="mt-2 text-xl font-semibold text-primary">{item.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700">{item.shortDescription}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <nav
          className="mt-12 flex flex-wrap gap-2 border-y border-stone-200 py-4"
          aria-label="Product page sections"
        >
          <a href="#overview" className="rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-50">
            Overview
          </a>
          <a href="#specifications" className="rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-50">
            Specifications
          </a>
          <a href="#inquiry" className="rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-50">
            Request Quote
          </a>
        </nav>

        <section id="overview" className="scroll-mt-24 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                Product Overview
              </p>
              <h2 className="mt-3 text-3xl font-bold text-primary">{product.shortName}</h2>
            </div>
            <div>
              <p className="text-lg leading-8 text-stone-700">{product.description}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <div key={feature} className="flex gap-3 rounded-xl bg-stone-faint p-4">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 flex-none text-secondary"
                      aria-hidden="true"
                    />
                    <p className="font-medium leading-7 text-stone-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="specifications"
          className="scroll-mt-24 rounded-3xl bg-stone-faint px-5 py-12 sm:px-8 lg:px-12"
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                Verified Specifications
              </p>
              <h2 className="mt-3 text-3xl font-bold text-primary">Buyer-ready product summary</h2>
              <p className="mt-4 text-base leading-7 text-stone-700">
                Only fields confirmed in the supplied product materials are shown. Pricing,
                sampling, production timing, and final trade terms are confirmed during inquiry
                review.
              </p>

              {product.customization.length > 0 && (
                <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
                  <Palette className="h-7 w-7 text-secondary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold text-primary">Customization review</h3>
                  <ul className="mt-4 space-y-3">
                    {product.customization.map((item) => (
                      <li key={item} className="flex gap-3 text-stone-700">
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 flex-none text-secondary"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <ProductDetails product={product} />
              <div className="mt-6 rounded-2xl bg-primary p-6 text-white">
                <h3 className="text-xl font-bold text-white">Suitable applications</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.applications.map((application) => (
                    <span
                      key={application}
                      className="rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium"
                    >
                      {application}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-stone-200 py-16 md:py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Why Work With KARUU
            </p>
            <h2 className="mt-3 text-3xl font-bold text-primary">
              Clear coordination for international B2B sourcing
            </h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              [SearchCheck, 'Selected sourcing', 'Product options are reviewed against your brief and target market.'],
              [ClipboardCheck, 'Clear development steps', 'Specifications, samples, and approval points are kept visible.'],
              [Globe2, 'Swedish B2B contact point', 'KARUU supports international communication and project coordination.'],
            ].map(([Icon, title, description]) => {
              const ItemIcon = Icon as typeof CheckCircle2;
              return (
                <div key={title as string} className="rounded-2xl border border-stone-200 bg-white p-6">
                  <ItemIcon className="h-7 w-7 text-secondary" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-primary">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{description as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="inquiry"
          className="scroll-mt-24 rounded-3xl border border-stone-200 bg-stone-faint p-5 sm:p-8 lg:p-12"
        >
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                Product Inquiry
              </p>
              <h2 className="mt-3 text-3xl font-bold text-primary">Request a tailored quote</h2>
              <p className="mt-4 text-base leading-7 text-stone-700">
                Start with your company, market, quantity, and key requirements. Optional product
                details can be added only when they are already known.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                Prefer a general inquiry?
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ProductInquiryForm product={product} />
          </div>
        </section>
      </div>
    </main>
  );
}
