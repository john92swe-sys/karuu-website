'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useBag } from '@/lib/cart';
import { commerceRequest, type CatalogSku, type CommerceStatus } from './commerce-client';
import { styles, formatMoney } from './store-shell';

export function BagContent({ cancelled = false }: { cancelled?: boolean }) {
  const bag = useBag();
  const [catalog, setCatalog] = useState<CatalogSku[]>([]);
  const [status, setStatus] = useState<CommerceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [market, setMarket] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const key = useRef('');
  useEffect(() => {
    let active = true;
    Promise.all([commerceRequest<{ items: CatalogSku[] }>('/api/commerce/catalog'), commerceRequest<CommerceStatus>('/api/commerce/status')]).then(([data, settings]) => { if (active) { setCatalog(data.items); setStatus(settings); } }).catch((reason: Error) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const bagIdentity = bag.ids.join(',');
  useEffect(() => { key.current = ''; }, [bagIdentity, market, consent]);
  const selected = bag.ids.map((id) => catalog.find((item) => item.id === id));
  const realItems = selected.filter((item): item is CatalogSku => Boolean(item));
  const currencies = new Set(realItems.map((item) => item.currency));
  const allowed = selected.length > 0 && selected.every((item) => item?.available && item.priceMinor !== null) && currencies.size === 1 && Boolean(status?.payments);
  const total = realItems.reduce((sum, item) => sum + (item.priceMinor ?? 0), 0);
  async function checkout() {
    if (!allowed || !consent || !market) return;
    setBusy(true); setError('');
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const result = await commerceRequest<{ url: string | null; orderId: string }>('/api/checkout', { method: 'POST', headers: { 'Idempotency-Key': key.current }, body: JSON.stringify({ skuIds: bag.ids, market, immediateDeliveryConsent: consent }) });
      if (!result.url) { window.location.assign(`/account?checkout=return&order=${encodeURIComponent(result.orderId)}`); return; }
      const url = new URL(result.url);
      if (url.protocol !== 'https:') throw new Error('The payment page could not be verified. Please contact KARUU.');
      window.location.assign(url.href);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Checkout could not be started.'); setBusy(false); }
  }
  if (!bag.ready || loading) return <div className={styles.panel} role="status">Checking your bag…</div>;
  return <>
    {cancelled && <div className={`${styles.notice} mb-5`} role="status">You returned from checkout. Payment and access are confirmed separately in <Link href="/account" className="underline">your orders</Link>.</div>}
    {error && <div className={`${styles.notice} ${styles.error} mb-5`} role="alert">{error}</div>}
    {bag.ids.length ? <div className={styles.twoColumns}>
      <section className={styles.panel}><h2>Your digital editions</h2><div className={styles.rows}>{bag.ids.map((id, index) => { const sku = selected[index]; return <div className={styles.row} key={id}><div><h3>{sku?.title || 'Edition no longer available'}</h3><p>{sku ? sku.components.map((item) => `${item.format} · ${item.language}`).join(' + ') : 'Remove this item to continue.'}</p>{sku?.priceMinor !== null && sku?.priceMinor !== undefined && <p className="!font-semibold !text-[#0a2f50]">{formatMoney(sku.priceMinor, sku.currency)}</p>}{sku && !sku.available && <p>{sku.unavailableReason || 'Orders are not open for this edition.'}</p>}</div><button type="button" className={styles.buttonOutline} onClick={() => bag.remove(id)} aria-label={`Remove ${sku?.title || 'unavailable edition'} from bag`}><Trash2 size={16} aria-hidden="true" />Remove</button></div>; })}</div><div className={styles.actions}><Link href="/creations" className={styles.buttonOutline}>Keep exploring</Link></div></section>
      <section className={styles.panel}><h2>Checkout</h2>{currencies.size === 1 && realItems.length === bag.ids.length && realItems.every((item) => item.priceMinor !== null) && <div className={styles.headingRow}><span>Edition total</span><strong className={styles.price}>{formatMoney(total, realItems[0].currency)}</strong></div>}<p className={styles.muted}>Pay in ordinary currency. A wallet or prepaid balance is not required. The payment page confirms the applicable tax and final amount, including any configured upgrade price for content already in your KARUU account.</p><hr className={styles.divider} /><div className={styles.field}><label className={styles.label} htmlFor="checkout-market">Your service region</label><select id="checkout-market" className={styles.select} value={market} onChange={(event) => setMarket(event.target.value)}><option value="">Choose your region</option>{[['SE', 'Sweden'], ['DE', 'Germany'], ['GB', 'United Kingdom'], ['US', 'United States'], ['FR', 'France'], ['NL', 'Netherlands'], ['DK', 'Denmark'], ['FI', 'Finland'], ['NO', 'Norway'], ['CN', 'China']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className={styles.hint}>Availability is checked for this region before payment.</p></div><label className={styles.check}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I request immediate access after payment and acknowledge that the applicable right of withdrawal for supplied digital content may end when delivery begins. I have reviewed the <Link href="/terms" className="underline">digital delivery and refund information</Link> and will review the purchase terms shown at checkout.</span></label><button type="button" className={`${styles.button} w-full`} disabled={!allowed || !market || !consent || busy} onClick={checkout}>{busy ? 'Opening secure checkout…' : 'Continue to payment'}<ArrowRight size={17} aria-hidden="true" /></button>{!allowed && <p className={`${styles.muted} mt-4`}>Checkout is not available for these editions yet. Your bag can be updated without making a payment.</p>}<p className={styles.noteLine}>Sign in to your KARUU account before checking out. A successful payment grants the exact editions listed in the order. External platform purchases remain with that platform.</p></section>
    </div> : <div className={styles.empty}><ShoppingBag size={38} className="mx-auto" strokeWidth={1.4} aria-hidden="true" /><h2>Your bag is waiting for a story.</h2><p className={styles.muted}>Explore the catalogue and choose a KARUU edition when direct orders are available. Existing platform editions can be purchased from their individual links.</p><Link href="/creations" className={styles.button}>Explore digital creations</Link></div>}
  </>;
}
