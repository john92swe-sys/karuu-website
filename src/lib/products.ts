import {
  categoryLabels,
  products,
  type Product,
  type ProductCategory,
  type ProductImage,
} from '@/data/products';

export { categoryLabels } from '@/data/products';

export type {
  Product,
  ProductCategory,
  ProductColor,
  ProductDocument,
  ProductImage,
  ProductImageKind,
  ProductSeo,
  ProductSizeChart,
} from '@/data/products';

const supplierReferencePattern = /\bfactory\s+(?:style|model)(?:\s+(?:number|no\.?))?\s*[:#-]?\s*[a-z0-9-]+\b[,.]?\s*/gi;
const hanCharacterPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

function capitalizeFirstLetter(value: string): string {
  return value.replace(/[A-Za-z]/, (letter) => letter.toUpperCase());
}

function removeSupplierReferences(value: string | undefined): string | undefined {
  if (!value) return value;

  const cleaned = value
    .replace(supplierReferencePattern, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*is\s+/i, '')
    .trim();

  return capitalizeFirstLetter(cleaned);
}

function hasPublicSafePath(image: ProductImage): boolean {
  let decodedPath = image.src;

  try {
    decodedPath = decodeURIComponent(image.src);
  } catch {
    // Keep the original path when decoding fails; the checks below still apply.
  }

  return !hanCharacterPattern.test(decodedPath);
}

function toPublicProduct(product: Product): Product {
  const verifiedHeroImage = product.gallery.find(hasPublicSafePath);
  const gallery = verifiedHeroImage
    ? [
        {
          ...verifiedHeroImage,
          alt: removeSupplierReferences(verifiedHeroImage.alt) || product.name,
        },
      ]
    : [];

  return {
    ...product,
    factoryCode: '',
    factoryStyleNumber: '',
    shortDescription: removeSupplierReferences(product.shortDescription) || product.shortDescription,
    description: removeSupplierReferences(product.description) || product.description,
    gallery,
    sizeChart: undefined,
    seo: {
      ...product.seo,
      description: removeSupplierReferences(product.seo.description) || product.seo.description,
    },
  };
}

export function getAllProducts(): Product[] {
  return products
    .filter((product) => product.published)
    .map(toPublicProduct)
    .filter((product) => product.gallery.length > 0);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getAllProducts().find((product) => product.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return getAllProducts().filter((product) => product.category === category);
}

export function getFeaturedProducts(limit = 4): Product[] {
  return getAllProducts()
    .filter((product) => product.featured)
    .slice(0, limit);
}

export function getAllCategories(): Array<{
  slug: ProductCategory;
  label: string;
  count: number;
}> {
  const published = getAllProducts();

  return (Object.keys(categoryLabels) as ProductCategory[])
    .map((slug) => ({
      slug,
      label: categoryLabels[slug],
      count: published.filter((product) => product.category === slug).length,
    }))
    .filter((category) => category.count > 0);
}
