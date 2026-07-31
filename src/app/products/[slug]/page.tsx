import type { Metadata } from 'next';
import Image from 'next/image';
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

interface PageProps {
  params: { slug: string };
}

const siteUrl = 'https://karuu.net';

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: 'Product Not Found | KARUU' };

  const mainImage = product.gallery[0];

  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: { canonical: product.seo.canonical },
    openGraph: {
      title: product.seo.title,
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
      title: product.seo.title,
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
    model: product.factoryStyleNumber,
    url: `${siteUrl}/products/${product.slug}`,
    description: product.shortDescription,
    image: product.gallery.map((image) => `${siteUrl}${image.src}`),
    brand: { '@type': 'Brand', name: 'KARUU' },
    category: product.categoryPath.join(' > '),
    material: product.material,
    color: product.colors.map((color) => color.name).join(', '),
    size: product.sizes.join(', '),
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
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
  const details = [
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

  return (
    <dl className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {details.map(([label, value], index) => (
        <div
          key={label}
          className={`grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:gap-6 ${
            index < details.length - 1 ? 'border-b border-stone-200' : ''
          }`}
        >
          <dt className="font-semibold text-primary">{label}</dt>
          <dd className="text-stone-600">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const whatsappMessage = encodeURIComponent(
    `Hello KARUU, I would like to inquire about ${product.name} (${product.sku}, factory style ${product.factoryStyleNumber}).`
  );
  const whatsappUrl = `https://wa.me/46708802017?text=${whatsappMessage}`;

  return (
    <main className="overflow-x-clip pb-20 pt-28">
      <StructuredData product={product} />

      <div className="container mx-auto max-w-7xl px-5 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Products', href: '/products' },
            { label: product.shortName },
          ]}
        />

        <section className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.gallery} colors={product.colors} />

          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
              {product.categoryPath.join(' / ')}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-primary sm:text-4xl">
              {product.name}
            </h1>

            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-stone-500">KARUU SKU</dt>
                <dd className="font-mono font-semibold text-primary">{product.sku}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-stone-500">Factory Style No.</dt>
                <dd className="font-mono text-stone-600">{product.factoryStyleNumber}</dd>
              </div>
            </dl>

            <p className="mt-6 text-base leading-7 text-stone-600">{product.shortDescription}</p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ['Material', product.material],
                ['Sizes', product.sizes.join('–')],
                ['Fit', product.fit],
                ['MOQ', product.moq],
              ]
                .filter((entry): entry is [string, string] => Boolean(entry[1]))
                .map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-stone-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-primary">{value}</div>
                  </div>
                ))}
            </div>

            <div className="mt-8 rounded-2xl bg-stone-faint p-5">
              <p className="font-semibold text-primary">
                Pricing tailored to your quantity and customization requirements.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                Share your target quantity, color mix, sizing, and branding requirements for
                review.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#inquiry"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              >
                Request a Quote
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#168a45] px-7 py-3.5 font-semibold text-white transition-colors hover:bg-[#12763b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="section-spacing border-t border-stone-200">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                Product Overview
              </p>
              <h2 className="mt-3 text-3xl font-bold text-primary">{product.shortName}</h2>
            </div>
            <p className="text-lg leading-8 text-stone-600">{product.description}</p>
          </div>
        </section>

        <section className="section-spacing bg-stone-faint px-5 sm:rounded-3xl sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Key Features
            </p>
            <h2 className="mt-3 text-3xl font-bold text-primary">Confirmed product details</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.features.map((feature) => (
              <div key={feature} className="flex gap-3 rounded-xl bg-white p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-secondary" aria-hidden="true" />
                <p className="font-medium leading-relaxed text-stone-700">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-spacing grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Product Details
            </p>
            <h2 className="mt-3 text-3xl font-bold text-primary">Specification summary</h2>
            <p className="mt-4 leading-7 text-stone-600">
              Only fields confirmed in the supplied product materials are shown. Sampling,
              production timing, and trade-term pricing are confirmed during inquiry review.
            </p>
          </div>
          <ProductDetails product={product} />
        </section>

        {product.sizeChart && (
          <section className="section-spacing border-y border-stone-200">
            <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                  Size Guide
                </p>
                <h2 className="mt-3 text-3xl font-bold text-primary">
                  {product.sku} size chart
                </h2>
                <p className="mt-4 leading-7 text-stone-600">
                  The original source chart is retained without rewriting uncertain
                  measurements. Click the chart to open the full image.
                </p>
              </div>
              <a
                href={product.sizeChart.image}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label="Open full size chart in a new tab"
              >
                <Image
                  src={product.sizeChart.image}
                  alt={product.sizeChart.alt}
                  width={product.sizeChart.width}
                  height={product.sizeChart.height}
                  className="h-auto w-full"
                />
                <span className="mt-3 block text-center text-sm font-semibold text-secondary">
                  Open full size chart
                </span>
              </a>
            </div>
          </section>
        )}

        <section className="section-spacing grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 p-7 sm:p-8">
            <Palette className="h-8 w-8 text-secondary" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-bold text-primary">Customization review</h2>
            <p className="mt-3 leading-7 text-stone-600">
              KARUU can coordinate a review of product-development and private-label
              requirements. Availability, cost, and MOQ impact are confirmed only after your
              brief is assessed.
            </p>
            <ul className="mt-5 space-y-3">
              {product.customization.map((item) => (
                <li key={item} className="flex gap-3 text-stone-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-secondary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-primary p-7 text-white sm:p-8">
            <h2 className="text-2xl font-bold">Suitable for</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {product.applications.map((application) => (
                <span
                  key={application}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium"
                >
                  {application}
                </span>
              ))}
            </div>
            <p className="mt-6 leading-7 text-white/75">
              Intended use is based on the supplied product description. Buyers should validate
              final specifications and samples for their market and application.
            </p>
          </div>
        </section>

        <section className="section-spacing border-t border-stone-200">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Why Work With KARUU
            </p>
            <h2 className="mt-3 text-3xl font-bold text-primary">
              Clear coordination for international B2B sourcing
            </h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              [SearchCheck, 'Selected sourcing', 'Product options are reviewed against your brief and target market.'],
              [ClipboardCheck, 'Product development', 'Specifications, samples, and approval points are kept clear.'],
              [CheckCircle2, 'Quality communication', 'Requirements and inspection expectations are aligned before ordering.'],
              [Globe2, 'International service', 'KARUU provides a Swedish B2B contact point for global buyers.'],
            ].map(([Icon, title, description]) => {
              const ItemIcon = Icon as typeof CheckCircle2;
              return (
                <div key={title as string} className="rounded-2xl border border-stone-200 p-6">
                  <ItemIcon className="h-7 w-7 text-secondary" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold text-primary">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{description as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="inquiry" className="scroll-mt-28 rounded-3xl bg-stone-faint p-5 sm:p-8 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                Inquiry
              </p>
              <h2 className="mt-3 text-3xl font-bold text-primary">Request a tailored quote</h2>
              <p className="mt-4 leading-7 text-stone-600">
                Provide your quantity, color, size, branding, trade-term, and delivery
                requirements. Pricing is prepared after review and is never generated on this
                website.
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
