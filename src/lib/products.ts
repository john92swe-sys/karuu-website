import {
  categoryLabels,
  products,
  type Product,
  type ProductCategory,
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

export function getAllProducts(): Product[] {
  return products.filter((product) => product.published);
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
