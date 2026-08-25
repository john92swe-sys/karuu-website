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
  ProductSpecification,
  ProductSizeChart,
} from '@/data/products';

const hanCharacterPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

function hasPublicSafePath(image: ProductImage): boolean {
  let decodedPath = image.src;

  try {
    decodedPath = decodeURIComponent(image.src);
  } catch {
    // Keep the original path when decoding fails; the safety check still applies.
  }

  return !hanCharacterPattern.test(decodedPath);
}

function toPublicProduct(product: Product): Product {
  const publicGallery = product.gallery.filter(hasPublicSafePath);

  return {
    ...product,
    colors: [],
    gallery: publicGallery,
    sizeChart: undefined,
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
