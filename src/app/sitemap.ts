import type { MetadataRoute } from 'next';
import { getAllProducts, getAllCategories } from '@/lib/products';
import { HYDRATION_PUBLICLY_DISCOVERABLE } from '@/config/catalog';
import { listPublicCreations } from '@/lib/server/works';
import { status } from '@/lib/server/commerce';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [creations, availability] = await Promise.all([listPublicCreations(), status()]);
  if (!availability.publicCatalogAvailable) throw new Error('Sitemap catalogue is temporarily unavailable.');
  const baseUrl = 'https://www.karuu.net';

  const staticRoutes = [
    '',
    '/products',
    '/oem-odm',
    '/manufacturing',
    '/quality-certifications',
    '/sustainability',
    '/about',
    '/contact',
    '/physical',
    '/physical/jkj-plus',
    '/creations',
    '/member-benefits',
    '/privacy',
    '/terms',
  ];

  const products = getAllProducts();
  const categories = getAllCategories();

  const productRoutes = products
    .filter((p) => HYDRATION_PUBLICLY_DISCOVERABLE || p.category !== 'hydration-drinkware')
    .map((p) => `/products/${p.slug}`);
  const categoryRoutes = categories
    .filter((c) => c.slug !== 'hydration-drinkware')
    .map((c) => `/products?category=${c.slug}`);

  const allRoutes = [...staticRoutes, ...productRoutes, ...categoryRoutes, ...creations.map(c => `/creations/${c.slug}`)];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/products/') ? 0.9 : 0.7,
  }));
}
