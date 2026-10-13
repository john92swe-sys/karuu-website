import type { Metadata } from 'next';
import { StoreShell, styles } from '@/components/store/store-shell';
import { BagContent } from '@/components/store/bag-content';
export const metadata: Metadata = { title: 'Your bag', robots: { index: false, follow: true } };
export default async function BagPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ checkout?: string }> }) {
  const searchParams = await searchParamsPromise;
  return <StoreShell crumbs={[{ label: 'Your bag' }]}><header className={styles.hero}><p className={styles.eyebrow}>KARUU digital editions</p><h1>Your bag</h1><p>A place for the stories and sounds you want to keep.</p></header><BagContent cancelled={searchParams.checkout === 'cancel'} /></StoreShell>;
}
