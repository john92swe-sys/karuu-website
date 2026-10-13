import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, BookOpen, ArrowUpRight, Music2, Gamepad2 } from 'lucide-react';
import type { Creation } from '@/data/creations';
import styles from './store.module.css';

export { styles };

export function StoreShell({ children, crumbs = [] }: { children: React.ReactNode; crumbs?: { label: string; href?: string }[] }) {
  return <div className={`c-page ${styles.page}`}><div className={`c-container ${styles.container}`}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link>{crumbs.map((crumb, index) => <span className="inline-flex items-center gap-2" key={`${crumb.label}-${index}`}><ChevronRight size={13} aria-hidden="true" />{crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</span>)}</nav>
    {children}
  </div></div>;
}

export function CreationCover({ creation, detail = false }: { creation: Creation; detail?: boolean }) {
  return <div className={detail ? styles.detailCover : styles.coverArea}>
    {creation.cover ? <Image src={creation.cover} alt={creation.coverAlt} className={styles.cover} priority={detail} sizes={detail ? '(max-width: 600px) 80vw, 360px' : '(max-width: 600px) 70vw, 240px'} width={creation.categories.includes('games') ? 1280 : 320} height={creation.categories.includes('games') ? 720 : 480} /> : <div className={styles.missingCover}>{creation.categories.includes('music') ? <Music2 size={36} strokeWidth={1} aria-hidden="true" /> : creation.categories.includes('games') ? <Gamepad2 size={36} strokeWidth={1} aria-hidden="true" /> : <BookOpen size={36} strokeWidth={1} aria-hidden="true" />}<span>{creation.title}</span><small>{creation.author || 'KARUU digital creations'}</small></div>}
  </div>;
}

export function CreationCard({ creation }: { creation: Creation }) {
  return <article className={`c-creation-card ${styles.card}`}>
    <Link href={`/creations/${creation.slug}`} aria-label={`Explore ${creation.title}`}><CreationCover creation={creation} /></Link>
    <div className={styles.cardBody}><div className={styles.tags}>{creation.featured && <span className={`${styles.tag} ${styles.tagPurple}`}>Featured story</span>}<span className={styles.tag}>{creation.categories.includes('music') ? 'Music' : creation.development ? creation.development.status : 'Ebook'}</span>{creation.categories.includes('audiobooks') && <span className={styles.tag}>Audio edition</span>}</div>
      <h2 className={styles.cardTitle}><Link href={`/creations/${creation.slug}`}>{creation.title}</Link></h2>
      {creation.author && <p className={styles.muted}>{creation.author}</p>}
      {creation.development?.imageCaption && <p className={styles.compact}>{creation.development.imageCaption}</p>}
      {creation.summary && <p className={styles.muted}>{creation.summary.length > 160 ? `${creation.summary.slice(0, 157).trim()}…` : creation.summary}</p>}
      <Link href={`/creations/${creation.slug}`} className={styles.cardAction}>{creation.categories.includes('music') ? 'Explore listening options' : creation.categories.includes('games') ? 'Explore the project' : 'Explore editions'} <ArrowUpRight size={16} aria-hidden="true" /></Link>
    </div>
  </article>;
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100);
}
