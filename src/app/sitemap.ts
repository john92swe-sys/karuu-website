import type { MetadataRoute } from 'next';
import { getAllProducts, getAllCategories } from '@/lib/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://karuu.se';

  const staticRoutes = [
    '',
    '/products',
    '/oem-odm',
    '/manufacturing',
    '/quality-certifications',
    '/sustainability',
    '/about',
    '/contact',
  ];

  const products = getAllProducts();
  const categories = getAllCategories();

  const productRoutes = products.map((p) => `/products/${p.slug}`);
  const categoryRoutes = categories.map((c) => `/products#${c.slug}`);

  const allRoutes = [...staticRoutes, ...productRoutes, ...categoryRoutes];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/products/') ? 0.9 : 0.7,
  }));
}
