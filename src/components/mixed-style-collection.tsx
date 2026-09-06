import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { ACTIVEWEAR_MOQ_STATEMENT } from '@/config/mixed-style-moq';
import { getProductBySlug, type Product } from '@/lib/products';

const scenarios = [
  {
    title: 'Yoga Studio & Teacher Training Capsule',
    description:
      'A starting point for teacher and staff wear, training cohorts, member merchandise, and small retail tests.',
    styles: ['kr01-0001', 'kr01-0002', 'kr01-0003', 'kr02-0001', 'kr02-0012', 'kr02-0027', 'kr02-0028', 'kr02-0030'],
  },
  {
    title: 'Pilates & Barre Studio Capsule',
    description:
      'A focused brief for instructor uniforms, studio-branded apparel, member retail, Reformer, Barre, Sculpt, and event use.',
    styles: ['kr01-0002', 'kr01-0003', 'kr01-0008', 'kr01-0009', 'kr02-0004', 'kr02-0011', 'kr02-0014', 'kr02-0031'],
  },
  {
    title: 'Emerging Activewear Brand Capsule',
    description:
      'A practical route to discuss private-label testing, coordinated range development, and an initial brand assortment.',
    styles: ['kr01-0010', 'kr01-0011', 'kr01-0012', 'kr01-0015', 'kr02-0005', 'kr02-0010', 'kr02-0013', 'kr02-0015'],
  },
] as const;

function getScenarioProducts(slugs: readonly string[]): Product[] {
  return slugs
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is Product => Boolean(product));
}

export function MixedStyleMoqBanner() {
  return (
    <section className="section-spacing bg-white">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="rounded-3xl border border-secondary/20 bg-secondary/5 px-6 py-8 shadow-sm sm:px-8 md:px-10 md:py-10">
          <div className="grid gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
                Flexible Mixed-Style MOQ
              </p>
              <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                Build a Coordinated Collection from 200 Pieces
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
                Start with a coordinated product series rather than committing to one style. KARUU can
                support a 200-piece starting MOQ within the same series, with styles mixed to suit your
                studio, retail concept or private-label collection. Final style, color and size splits are
                confirmed before quotation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-light"
              >
                Request a Mixed-Style Collection Plan
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/20 bg-white px-6 py-3 font-semibold text-primary transition-colors hover:border-secondary hover:bg-stone-faint"
              >
                Browse the Full Collection
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CollectionScenariosSection() {
  return (
    <section className="section-spacing bg-stone-faint">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Start with your use case</p>
          <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
            Choose a practical collection starting point
          </h2>
          <p className="mt-4 text-base leading-7 text-stone-700">
            Each capsule is a procurement conversation starter, not a promise that every listed style
            belongs to one factory series. KARUU confirms eligible styles, series, and final order
            structure for each project.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {scenarios.map((scenario) => {
            const products = getScenarioProducts(scenario.styles);
            const representativeProducts = products.slice(0, 3);

            return (
              <article key={scenario.title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                      <Layers3 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-primary">{scenario.title}</h3>
                    <p className="mt-3 leading-7 text-stone-700">{scenario.description}</p>
                    <p className="mt-5 text-sm leading-6 text-stone-600">
                      {products.length} representative styles are retained in this planning list. The
                      highlighted items are examples only and do not limit the full KARUU catalogue.
                      They do not indicate all pieces are available together in a single 200-piece
                      order.
                    </p>
                    <ul className="mt-4 grid gap-2 text-sm leading-6 text-stone-700">
                      {products.map((product) => (
                        <li key={product.sku}>
                          <Link href={`/products/${product.slug}`} className="font-medium text-primary hover:text-secondary">
                            {product.sku} — {product.shortName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                      <Link
                        href="/contact"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                      >
                        Request a Mixed-Style Collection Plan
                      </Link>
                      <Link
                        href="/products"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/20 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:border-secondary hover:bg-stone-faint"
                      >
                        View the Full KARUU Catalogue
                      </Link>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {representativeProducts.map((product) => (
                      <ProductCard key={product.sku} product={product} />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-4xl text-center text-sm leading-6 text-stone-600">
          {ACTIVEWEAR_MOQ_STATEMENT}
        </p>
      </div>
    </section>
  );
}
