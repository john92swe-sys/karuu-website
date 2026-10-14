'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag, Check, ArrowUpRight } from 'lucide-react';
import type { Creation } from '@/data/creations';
import { addToBag } from '@/lib/cart';
import { commerceRequest, type CatalogSku } from './commerce-client';
import { styles, formatMoney } from './store-shell';

export function EditionPurchase({ creation }: { creation: Creation }) {
  const [skus, setSkus] = useState<CatalogSku[]>([]);
  const [selected, setSelected] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    commerceRequest<{ items: CatalogSku[] }>('/api/commerce/catalog').then((data) => {
      if (!active) return;
      const matches = data.items.filter((item) => item.slug === creation.slug);
      setSkus(matches); setSelected(matches.find((item) => item.available)?.id || matches[0]?.id || '');
    }).catch(() => { if (active) setError('KARUU purchase options are currently unavailable.'); }).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [creation.slug]);
  const sku = skus.find((item) => item.id === selected);
  const isMusic = creation.categories.includes('music');
  return <div className={styles.panel}><h2>{isMusic ? 'Listening options' : 'Choose your edition'}</h2>
    {skus.length ? <fieldset><legend className="sr-only">Available editions</legend>{skus.map((item) => <label className={`${styles.formatOption} ${selected === item.id ? styles.formatOptionSelected : ''}`} key={item.id}><input type="radio" name={`edition-${creation.id}`} value={item.id} checked={selected === item.id} onChange={() => { setSelected(item.id); setAdded(false); }} />{item.title}<small>{item.components.map((component) => `${component.format} · ${component.language}`).join(' + ')}</small>{item.priceMinor !== null && <span className={styles.price}>{formatMoney(item.priceMinor, item.currency)}{item.promotion && item.normalPriceMinor !== null && item.normalPriceMinor !== undefined && <del className="ml-3 text-sm font-normal text-[#617b90]">{formatMoney(item.normalPriceMinor, item.currency)}</del>}</span>}{!item.available && <small>{'This edition is not open for direct orders yet.'}</small>}</label>)}</fieldset> : <div className={styles.rows}>{creation.formats.map((format) => <div className={styles.row} key={format.label}><div><h3>{format.label}</h3><p>{format.note}</p></div><span className={`${styles.tag} ${format.status === 'published-externally' ? styles.tagGreen : styles.tagPurple}`}>{format.status === 'published-externally' ? 'Platform edition' : 'In preparation'}</span></div>)}</div>}
    {sku?.available && sku.priceMinor !== null ? <div className={styles.actions}><button type="button" className={styles.button} onClick={() => { addToBag(sku.id); setAdded(true); }}>{added ? <Check size={17} aria-hidden="true" /> : <ShoppingBag size={17} aria-hidden="true" />}{added ? 'Added to your bag' : 'Add to bag'}</button>{added && <Link href="/bag" className={styles.buttonOutline}>View bag</Link>}</div> : <p className={`${styles.muted} mt-4`}>{loaded ? 'Direct orders are not open for this work yet. Available platform editions are listed below.' : 'Checking available editions…'}</p>}
    {error && <p className={styles.compact} role="status">{error}</p>}
    {creation.links.length > 0 && <><hr className={styles.divider} /><h3>{isMusic ? 'Listen online' : 'Available platform editions'}</h3><div className={styles.actions}>{creation.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.buttonOutline}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens a new tab)</span></a>)}</div><p className={styles.noteLine}>{isMusic ? 'Online listening is provided by YouTube. A KARUU download is not currently available.' : 'Platform purchases, prices and access are managed by the named platform. These purchases do not automatically appear in your KARUU account.'}</p></>}
  </div>;
}
