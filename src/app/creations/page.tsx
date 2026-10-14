import { listPublicCreations } from '@/lib/server/works';
import { status } from '@/lib/server/commerce';
import type { Metadata } from 'next';
import { creationCategories, type CreationCategory } from '@/data/creations';
import { CreationCatalog } from '@/components/store/creation-catalog';
import { StoreShell, styles } from '@/components/store/store-shell';

export const metadata: Metadata = { title: 'Digital creations', description: 'Explore original KARUU stories, ebooks and audio editions, with music and games as releases become available.', alternates: { canonical: '/creations' } };

export const dynamic = 'force-dynamic';
export default async function CreationsPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const searchParams = await searchParamsPromise;
  const [items, service] = await Promise.all([listPublicCreations(), status()]);
  const category = creationCategories.some((item) => item.id === searchParams.category) ? searchParams.category as CreationCategory | 'all' : 'all';
  return <StoreShell crumbs={[{ label: 'Digital creations' }]}><header className={`c-panel ${styles.hero}`}><p className={styles.eyebrow}>KARUU digital creations</p><h1>Stories for your everyday escape.</h1><p>Explore stories, music and games from KARUU. Find an ebook, listen online, or follow a project in development.</p></header><CreationCatalog unavailable={!service.publicCatalogAvailable} items={items} initialCategory={category} initialQuery={searchParams.q || ''} /></StoreShell>;
}
