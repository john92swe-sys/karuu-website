'use client';

import Link from 'next/link';
import type { Product } from '@/lib/products';
import { getProductImagePath } from '@/lib/products';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const firstImage = getProductImagePath(product.sku, 1);
  const placeholder = '/images/placeholder-product.svg';

  return (
    <div className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all duration-300 hover:-translate-y-1">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] bg-stone-faint overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImage}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = placeholder;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide text-primary bg-white/90 backdrop-blur-sm rounded-full">
              {product.sku}
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs text-secondary font-medium tracking-wide uppercase mb-1.5">
            {product.categoryLabel}
          </div>
          <h3 className="text-base font-semibold text-primary mb-2 leading-snug group-hover:text-secondary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-stone-500 line-clamp-2 mb-4">
            {product.fabric}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary/70">
              {product.colors.length}+ colors
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary group-hover:gap-2 transition-all">
              View Details <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
