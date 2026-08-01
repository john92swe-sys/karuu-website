import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageSquareText } from 'lucide-react';
import type { Product } from '@/lib/products';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.gallery[0];
  const hoverImage = product.gallery[1];
  const productUrl = `/products/${product.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-xl">
      <Link
        href={productUrl}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-faint">
          <Image
            src={mainImage.src}
            alt={mainImage.alt}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1535px) 33vw, 25vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
          {hoverImage && (
            <Image
              src={hoverImage.src}
              alt={hoverImage.alt}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1535px) 33vw, 25vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
            />
          )}
          <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-primary shadow-sm">
            {product.sku}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
          {product.categoryLabel}
        </p>
        <Link
          href={productUrl}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          <h2 className="min-h-[3.2rem] text-lg font-semibold leading-snug text-primary transition-colors hover:text-secondary">
            {product.name}
          </h2>
        </Link>
        <p className="mt-3 line-clamp-2 text-[15px] leading-6 text-stone-700">
          {product.shortDescription}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Link
            href={productUrl}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          >
            View Product
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={`${productUrl}#inquiry`}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-3 text-sm font-semibold text-primary transition-colors hover:border-secondary hover:bg-stone-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            Request Quote
          </Link>
        </div>
      </div>
    </article>
  );
}
