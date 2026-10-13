import type { Metadata } from 'next';
import { StoreShell, styles } from '@/components/store/store-shell';
import { AdminContent } from '@/components/store/admin-content';
export const metadata: Metadata = { title: 'Store administration', robots: { index: false, follow: false } };
export default function AdminPage() {
  return <StoreShell crumbs={[{ label: 'Store administration' }]}><header className={styles.hero}><p className={styles.eyebrow}>KARUU operations</p><h1>Store administration</h1><p>Manage genuine assets, editions, orders and enquiries. Every change records its operator and reason.</p></header><AdminContent /></StoreShell>;
}
