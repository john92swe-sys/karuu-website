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
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg">
      <Link href={productUrl} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2">
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-faint">
          <Image
            src={mainImage.src}
            alt={mainImage.alt}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
          {hoverImage && (
            <Image
              src={hoverImage.src}
              alt={hoverImage.alt}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
            />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-primary shadow-sm">
            {product.sku}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-secondary">
          {product.categoryLabel}
        </p>
        <Link href={productUrl} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
          <h2 className="mb-2 text-base font-semibold leading-snug text-primary transition-colors hover:text-secondary">
            {product.name}
          </h2>
        </Link>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-stone-500">
          {product.shortDescription}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={productUrl}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          >
            View Product
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={`${productUrl}#inquiry`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-stone-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            Request Quote
          </Link>
        </div>
      </div>
    </article>
  );
}
