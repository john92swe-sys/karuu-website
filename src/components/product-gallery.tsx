'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import type { ProductColor, ProductImage } from '@/lib/products';

interface ProductGalleryProps {
  images: ProductImage[];
  colors: ProductColor[];
}

export function ProductGallery({ images, colors }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const showPrevious = () =>
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
  const showNext = () => setActiveIndex((index) => (index + 1) % images.length);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft') {
        setActiveIndex((index) => (index - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((index) => (index + 1) % images.length);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, images.length]);

  if (images.length === 0) return null;

  const activeImage = images[activeIndex];

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > 45) {
      if (distance > 0) showPrevious();
      else showNext();
    }
    touchStartX.current = null;
  };

  return (
    <div className="min-w-0">
      <div
        className="group relative aspect-[3/4] touch-pan-y overflow-hidden rounded-2xl bg-[#f2f1ee]"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          key={activeImage.src}
          src={activeImage.src}
          alt={activeImage.alt}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="object-contain"
        />

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          aria-label="Open image viewer"
        >
          <Expand className="h-5 w-5" aria-hidden="true" />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-opacity hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              aria-label="Previous product image"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-opacity hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              aria-label="Next product image"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}

        <div className="absolute bottom-3 right-3 rounded-full bg-primary/80 px-3 py-1 text-xs font-medium text-white">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Product image thumbnails">
        {images.map((image, index) => (
          <button
            type="button"
            key={image.src}
            onClick={() => setActiveIndex(index)}
            className={`relative aspect-[3/4] w-20 flex-none overflow-hidden rounded-lg border-2 bg-stone-faint transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              index === activeIndex
                ? 'border-secondary ring-2 ring-secondary/20'
                : 'border-transparent hover:border-stone-300'
            }`}
            aria-label={`View ${image.alt}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      <fieldset className="mt-5">
        <legend className="mb-3 text-sm font-semibold text-primary">Available colors</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => {
            const selected = activeImage.color === color.name;
            return (
              <button
                type="button"
                key={color.name}
                onClick={() => setActiveIndex(color.imageIndex)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  selected
                    ? 'border-primary bg-primary text-white'
                    : 'border-stone-200 bg-white text-stone hover:border-secondary'
                }`}
                aria-pressed={selected}
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/15"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden="true"
                />
                {color.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false);
          }}
        >
          <button
            type="button"
            ref={closeButtonRef}
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white text-primary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close image viewer"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="relative h-[88vh] w-[92vw] max-w-6xl">
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              sizes="92vw"
              className="object-contain"
              priority
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-3 top-1/2 inline-flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:left-6"
                aria-label="Previous product image"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-3 top-1/2 inline-flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:right-6"
                aria-label="Next product image"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
