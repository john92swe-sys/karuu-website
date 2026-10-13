import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight, Headphones, Leaf } from 'lucide-react';
import type { Creation } from '@/data/creations';
import { listPublicCreations } from '@/lib/server/works';
import { status } from '@/lib/server/commerce';
import { HomeExplore } from '@/components/store/home-explore';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Products for life. Stories to explore.',
  description: 'Explore KARUU women’s activewear, JKJ-Plus collaboration, and original books, audio, music and games. Physical products and digital creations from Sweden.',
  alternates: { canonical: '/' },
};

function FeaturedBook({ book }: { book: Creation }) {
  const kindle = book.links.find((link) => /amazon\.[^/]+\/dp\//.test(link.url));
  const platform = kindle || book.links.find((link) => link.format === 'Ebook');
  const platformLabel = kindle ? 'View on Kindle' : platform?.url.includes('play.google.com/') ? 'View on Google Play' : platform?.label || 'View edition';
  return <article className="hc-featured-book">
    <Link className="hc-book-cover" href={`/creations/${book.slug}`} aria-label={`Explore ${book.title}`}>
      {book.cover ? <Image src={book.cover} alt={book.coverAlt} fill sizes="(max-width: 700px) 110px, 155px" /> : <span>{book.title}</span>}
    </Link>
    <h3><Link href={`/creations/${book.slug}`}>{book.title}</Link></h3>
    <Link href={`/creations/${book.slug}`} className="hc-button hc-button-small">Explore book <ArrowRight size={14} aria-hidden="true" /></Link>
    {platform && <a className="hc-platform-link" href={platform.url} target="_blank" rel="noopener noreferrer">{platformLabel}<span className="sr-only"> (opens a new tab)</span></a>}
  </article>;
}

export default async function HomePage() {
  const [allCreations, availability] = await Promise.all([listPublicCreations(), status()]);
  const books = allCreations.filter((work) => work.featured && work.categories.includes('ebooks')).slice(0, 2);
  return <div className="hc-home">
    <section className="hc-hero" aria-labelledby="home-title">
      <div className="hc-hero-scene" aria-hidden="true" />
      <div className="hc-hero-copy">
        <h1 id="home-title">Products for life.<br />Stories to explore.</h1>
        <p>Physical products and original digital creations from KARUU.</p>
        <div className="hc-hero-actions">
          <Link href="/physical" className="hc-button">Explore products <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/creations" className="hc-button hc-button-outline">Explore creations <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </div>
      <p className="hc-hero-handwriting" aria-hidden="true">A more<br />active life.<br />A richer<br />tomorrow.</p>
      <span className="hc-hero-disclosure">AI-created brand illustration.</span>
    </section>

    <div className="hc-content">
      <section className="hc-businesses" aria-label="Explore our two businesses">
        <section className="hc-business hc-physical" aria-labelledby="physical-title">
          <header className="hc-business-heading">
            <div><h2 id="physical-title">Physical products</h2><p>Thoughtful design for everyday life.</p></div>
            <Link href="/contact" className="hc-project-button">Start a project <ArrowRight size={15} aria-hidden="true" /></Link>
            <Link href="/physical" className="hc-mobile-section-link" aria-label="Explore physical products"><ChevronRight size={22} aria-hidden="true" /></Link>
          </header>
          <div className="hc-physical-grid">
            <Link href="/products" className="hc-physical-card hc-activewear">
              <Image src="/images/products/kr01-0004/02-light-pink-lifestyle.webp" alt="Published KARUU light-pink activewear lifestyle photograph" fill sizes="(max-width: 700px) 48vw, 290px" className="hc-activewear-image" />
              <div className="hc-physical-card-copy"><h3>Women’s <br />activewear</h3><p>OEM / ODM &amp; private label.</p><span className="hc-card-button">Explore activewear <ArrowRight size={14} aria-hidden="true" /></span></div>
            </Link>
            <Link href="/physical/jkj-plus" className="hc-physical-card hc-drinkware">
              <Image src="/images/lifestyle/c-drinkware-concept.webp" alt="Brand collaboration illustration of drinkware; not an identified sale model" fill sizes="(max-width: 700px) 48vw, 290px" />
              <div className="hc-physical-card-copy"><h3>JKJ-Plus <br />drinkware</h3><p>Cups and bottles for your project.</p><span className="hc-card-button">Explore collaboration <ArrowRight size={14} aria-hidden="true" /></span></div>
              <span className="hc-illustration-caption">Collaboration illustration</span>
            </Link>
          </div>
          <div className="hc-mobile-physical-footer"><p>Women’s activewear and JKJ-Plus drinkware</p><Link href="/contact">Start a project <ArrowRight size={14} aria-hidden="true" /></Link></div>
        </section>

        <section className="hc-business hc-digital" aria-labelledby="digital-title">
          <header className="hc-business-heading"><div><h2 id="digital-title">Digital creations</h2><p>Original stories, music and games for curious minds.</p></div><Link href="/creations" className="hc-all-books">Explore all books <ArrowRight size={14} aria-hidden="true" /></Link><Link href="/creations" className="hc-mobile-section-link" aria-label="Explore digital creations"><ChevronRight size={22} aria-hidden="true" /></Link></header>
          {!availability.publicCatalogAvailable && <p className="hc-service-notice" role="status">Digital creation information is temporarily unavailable. Please try again later.</p>}
          <div className="hc-digital-grid">
            {books.map((book) => <FeaturedBook key={book.slug} book={book} />)}
            <Link href="/creations?category=audiobooks" className="hc-audio-entry">
              <div className="hc-audio-copy"><h3>Books &amp; audio</h3><p>Read or listen,<br />wherever you are.</p></div>
              <div className="hc-audio-image"><Image src="/images/lifestyle/c-books-audio.webp" alt="Reading and listening lifestyle illustration with books and headphones" fill sizes="(max-width: 700px) 85px, 165px" /><span className="hc-audio-symbol"><Headphones size={19} aria-hidden="true" /></span></div>
              <span className="hc-card-button">Explore reading<br />&amp; listening <ArrowRight size={14} aria-hidden="true" /></span>
            </Link>
          </div>
        </section>
      </section>

      <HomeExplore creations={allCreations} available={availability.publicCatalogAvailable} />
      <Link href="/member-benefits" className="hc-member-strip"><span className="hc-member-mark">KRU</span><div><h2>Member benefits</h2><p>{availability.kru.enabled ? 'Explore the programme information for your market.' : 'Programme information. Rewards are not active.'}</p></div><span className="hc-member-note"><Leaf size={25} aria-hidden="true" />More to explore. A richer everyday.</span><span className="hc-member-button">Learn more <ArrowRight size={15} aria-hidden="true" /></span></Link>
    </div>
  </div>;
}
