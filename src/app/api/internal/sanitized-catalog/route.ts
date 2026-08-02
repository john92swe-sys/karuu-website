import { NextRequest, NextResponse } from 'next/server';
import { products, type Product, type ProductImage } from '@/data/products';

export const dynamic = 'force-dynamic';

const supplierSubjectPattern = /^\s*factory\s+(?:style|model)(?:\s+(?:number|no\.?))?\s*[:#-]?\s*[a-z0-9-]+\b[,.]?\s*/i;
const supplierReferencePattern = /\bfactory\s+(?:style|model)(?:\s+(?:number|no\.?))?\s*[:#-]?\s*[a-z0-9-]+\b[,.]?\s*/gi;
const hanCharacterPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

function cleanCopy(value: string | undefined): string | undefined {
  if (!value) return value;
  const withSubject = supplierSubjectPattern.test(value)
    ? value.replace(supplierSubjectPattern, 'This product ')
    : value;
  return withSubject
    .replace(supplierReferencePattern, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[A-Za-z]/, (letter) => letter.toUpperCase());
}

function safeImage(image: ProductImage): boolean {
  let decoded = image.src;
  try {
    decoded = decodeURIComponent(image.src);
  } catch {
    // Keep original value.
  }
  return !hanCharacterPattern.test(decoded);
}

function sanitize(product: Product): Product {
  const hero = product.gallery.find(safeImage);
  return {
    ...product,
    factoryCode: '',
    factoryStyleNumber: '',
    shortDescription: cleanCopy(product.shortDescription) || product.shortDescription,
    description: cleanCopy(product.description) || product.description,
    gallery: hero
      ? [
          {
            ...hero,
            alt: cleanCopy(hero.alt) || product.name,
          },
        ]
      : [],
    colors: [],
    sizeChart: undefined,
    seo: {
      ...product.seo,
      description: cleanCopy(product.seo.description) || product.seo.description,
    },
  };
}

export async function GET(request: NextRequest) {
  const part = request.nextUrl.searchParams.get('part') || 'catalog';
  const catalog = products.map(sanitize);
  const allImages = new Set<string>();
  const keptImages = new Set<string>();

  for (const product of products) {
    for (const image of product.gallery) allImages.add(image.src.replace(/^\//, ''));
    if (product.sizeChart) allImages.add(product.sizeChart.image.replace(/^\//, ''));
  }
  for (const product of catalog) {
    for (const image of product.gallery) keptImages.add(image.src.replace(/^\//, ''));
  }

  if (part === 'delete') {
    return NextResponse.json(
      [...allImages].filter((image) => !keptImages.has(image)).sort(),
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (part === 'keep') {
    return NextResponse.json([...keptImages].sort(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json(catalog, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
