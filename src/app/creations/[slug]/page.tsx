import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listPublicCreations, getPublicCreation } from '@/lib/server/works';
import { status } from '@/lib/server/commerce';
import { CreationCover, StoreShell, styles } from '@/components/store/store-shell';
import { EditionPurchase } from '@/components/store/edition-purchase';

export const dynamic = 'force-dynamic';
export async function generateStaticParams() { return (await listPublicCreations()).map((creation) => ({ slug: creation.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const creation = await getPublicCreation(slug);
  if (!creation) return { title: (await status()).publicCatalogAvailable ? 'Creation not found' : 'Creation temporarily unavailable', robots: { index: false, follow: true } };
  return { title: creation.title, description: creation.summary || `Explore ${creation.title}${creation.author ? ` by ${creation.author}` : ''}, editions and reading options.`, alternates: { canonical: `/creations/${creation.slug}` }, openGraph: { title: creation.title, ...(creation.cover ? { images: [{ url: creation.cover, alt: creation.coverAlt }] } : {}) } };
}
export default async function CreationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const creation = await getPublicCreation(slug);
  if (!creation) {
    if (!(await status()).publicCatalogAvailable) return <StoreShell crumbs={[{ label: 'Digital creations', href: '/creations' }]}><section className={styles.panel}><h1 className={styles.detailTitle}>This work is temporarily unavailable.</h1><p className={styles.muted}>Please try again later. Existing external-platform purchases remain with their platform.</p><div className={styles.actions}><Link href="/creations" className={styles.buttonOutline}>Return to the catalogue</Link><Link href="/contact" className={styles.button}>Contact KARUU</Link></div></section></StoreShell>;
    notFound();
  }
  return <StoreShell crumbs={[{ label: 'Digital creations', href: '/creations' }, { label: creation.title }]}><article className={styles.detail}>
    <div><CreationCover creation={creation} detail />{creation.development?.imageCaption && <p className={`${styles.compact} mt-3`}>{creation.development.imageCaption}</p>}</div>
    <div><p className={styles.eyebrow}>{creation.categories.includes('music') ? 'KARUU music' : creation.categories.includes('games') ? 'KARUU game project · In development' : 'Original KARUU story'}</p><h1 className={styles.detailTitle}>{creation.title}</h1>{creation.author && <p className="text-lg mb-5">By {creation.author}</p>}
      {creation.summary && <p className={styles.copy}>{creation.summary}</p>}
      {creation.aiDisclosure && <p className={`${styles.compact} mt-4`}>{creation.aiDisclosure}</p>}
      <dl className={styles.facts}>{creation.language && <div><dt>Language</dt><dd>{creation.language}</dd></div>}{creation.publisher && <div><dt>Publisher</dt><dd>{creation.publisher}</dd></div>}<div><dt>Explore</dt><dd>{creation.formats.map((format) => format.label).join(' / ')}</dd></div></dl>
      <>{creation.categories.includes('games') ? <section className={styles.panel}><h2>In development</h2><p className={styles.muted}>{creation.id === 'nordic-aurora-relay' ? 'This is an early working prototype.' : 'This project is in development.'} A public demo, supported release platforms, game accounts and purchase or recharge options will be announced when they are ready.</p><p className={styles.noteLine}>No game purchase or point recharge is currently available here.</p></section> : <EditionPurchase creation={creation} />}</>
      {!creation.categories.includes('music') && !creation.categories.includes('games') && <section className={`${styles.panel} mt-5`}><h2>Reading and listening</h2><details className={styles.details}><summary>What is included in a read + listen edition?</summary><p>A read + listen edition combines an ebook with the audiobook of the same work. Each enabled KARUU bundle lists its exact language, files and access conditions before checkout. Edition availability is shown above.</p></details><details className={styles.details}><summary>Where do I find a KARUU purchase?</summary><p>Once a payment is confirmed, the included works appear in <Link href="/account" className="underline">My creations</Link> in your KARUU account. Platform purchases remain in that platform’s library. Owning a Google Play or Kindle edition does not automatically grant a KARUU edition.</p></details>{creation.id === 'key' && <details className={styles.details}><summary>About the Google Play audio edition</summary><p>The Google Play audiobook edition is AI narrated by Ava (from Google). Its availability and listening access are managed by Google Play. A public listing does not mean a KARUU audio download is currently available.</p></details>}</section>}
    </div></article></StoreShell>;
}
