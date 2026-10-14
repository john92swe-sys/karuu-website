import type { Metadata } from 'next';
import { StoreShell, styles } from '@/components/store/store-shell';
import { AccountContent } from '@/components/store/account-content';
export const metadata: Metadata = { title: 'My creations and account', robots: { index: false, follow: true } };
export default async function AccountPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ checkout?: string; order?: string; tab?: string; reset?: string; verified?: string }> }) {
  const searchParams = await searchParamsPromise;
  return <StoreShell crumbs={[{ label: 'Your account' }]}><header className={styles.hero}><p className={styles.eyebrow}>Your KARUU collection</p><h1>My creations</h1><p>Find your orders, return to your stories, and keep listening.</p></header><AccountContent resetToken={searchParams.reset || ''} verified={searchParams.verified === '1'} checkoutReturn={searchParams.checkout === 'return'} checkoutOrder={searchParams.order || ''} initialTab={searchParams.tab === 'orders' || searchParams.tab === 'benefits' ? searchParams.tab : 'library'} /></StoreShell>;
}
