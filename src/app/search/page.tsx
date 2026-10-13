import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowRight } from 'lucide-react';
import { getAllProducts } from '@/lib/products';
import { listPublicCreations } from '@/lib/server/works';
import { status } from '@/lib/server/commerce';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true }, alternates: { canonical: '/search' } };
export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const [creations, availability] = await Promise.all([listPublicCreations(), status()]);
  const query = (searchParams.q || '').trim().slice(0, 120);
  const physical = query ? getAllProducts().filter(p => `${p.name} ${p.sku} ${p.shortDescription}`.toLowerCase().includes(query.toLowerCase())) : [];
  const digital = query ? creations.filter(p => `${p.title} ${p.author || ''} ${p.summary || ''}`.toLowerCase().includes(query.toLowerCase())) : [];
  return <div className="c-container c-page"><span className="c-eyebrow">FIND SOMETHING TO EXPLORE</span><h1 className="c-title">Search KARUU.</h1><form action="/search" className="c-button-row max-w-2xl"><label htmlFor="site-search" className="sr-only">Search products and digital creations</label><input id="site-search" name="q" type="search" maxLength={120} defaultValue={query} placeholder="Search a product, book, song or game" className="rounded-xl border border-[#aabecb] bg-white px-4 py-3 grow min-w-0 text-sm" /><button className="c-btn" type="submit"><Search size={18} />Search</button></form>
    {!availability.publicCatalogAvailable && <p role="status" className="c-form-error mt-5">Digital creation information is temporarily unavailable. Results below cover available physical products; please retry digital search later.</p>}
    {!query ? <div className="c-two-cards"><Link href="/physical" className="c-panel c-mint"><h2>Physical products</h2><p>Browse our activewear catalogue and collaboration options.</p><span className="c-text-link">Explore products <ArrowRight size={16} /></span></Link><Link href="/creations" className="c-panel c-lilac"><h2>Digital creations</h2><p>Books, audio editions, music and games in development.</p><span className="c-text-link">Explore creations <ArrowRight size={16} /></span></Link></div> : <div className="mt-10"><p role="status" className="c-muted text-sm mb-6">{physical.length + digital.length} results for “{query}”</p>{!physical.length && !digital.length && <p>Try a different title, product name or SKU.</p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{physical.map(p => <Link key={p.slug} href={`/products/${p.slug}`} className="c-panel flex gap-4 items-center"><Image src={p.gallery[0].src} alt={p.gallery[0].alt} width={66} height={88} className="rounded-lg object-cover" /><div><span className="c-eyebrow">{p.sku}</span><h2 className="font-bold text-sm">{p.name}</h2><p className="c-muted text-xs">Physical product · Request a quote</p></div></Link>)}{digital.map(p => <Link key={p.slug} href={`/creations/${p.slug}`} className="c-panel flex gap-4 items-center">{p.cover && <Image src={p.cover} alt={p.coverAlt} width={66} height={88} className="rounded object-cover" />}<div><span className="c-eyebrow">DIGITAL CREATION</span><h2 className="font-bold text-sm">{p.title}</h2><p className="c-muted text-xs">{p.author || 'Explore release information'}</p></div></Link>)}</div></div>}
  </div>;
}
