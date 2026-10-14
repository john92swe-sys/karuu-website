'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, BookOpen, Gamepad2, Headphones, Music2, Play } from 'lucide-react';
import type { Creation } from '@/data/creations';

type TabId = 'books' | 'audio' | 'music' | 'games';
const tabs = [
  { id: 'books' as const, label: 'Books', Icon: BookOpen },
  { id: 'audio' as const, label: 'Books & audio', Icon: Headphones },
  { id: 'music' as const, label: 'Music', Icon: Music2 },
  { id: 'games' as const, label: 'Games', Icon: Gamepad2 },
];

function WorkRow({ work, tab }: { work: Creation; tab: TabId }) {
  const kindle = work.links.find((link) => /amazon\.[^/]+\/dp\//.test(link.url));
  const audio = work.links.find((link) => /audio/i.test(link.format));
  const music = work.links.find((link) => /youtube\.com\/watch/.test(link.url));
  const demo = work.formats.some((format) => format.label === 'Free browser demo' && format.status === 'published-externally') ? work.links.find((link) => link.format === 'Free browser demo') : undefined;
  const ebook = kindle || work.links.find((link) => link.format === 'Ebook');
  const external = tab === 'audio' ? audio : tab === 'music' ? music : tab === 'games' ? demo : ebook;
  const externalLabel = tab === 'audio' ? 'Audio edition' : tab === 'music' ? 'Listen on YouTube' : tab === 'games' ? 'Play free demo' : kindle ? 'View on Kindle' : ebook?.url.includes('play.google.com/') ? 'View on Google Play' : ebook?.label;
  const image = work.cover || (tab === 'music' ? '/images/lifestyle/c-music-landscape.webp' : null);
  return <article className={`hc-work-row hc-work-row-${tab}`}>
    <Link className="hc-work-thumbnail" href={`/creations/${work.slug}`} aria-label={`Explore ${work.title}`}>
      {image ? <Image src={image} alt={work.cover ? work.coverAlt : 'Music lifestyle illustration'} fill sizes="(max-width: 700px) 48px, 84px" /> : <span aria-hidden="true">{tab === 'games' ? <Gamepad2 size={27} strokeWidth={1.5} /> : <BookOpen size={27} strokeWidth={1.5} />}</span>}
    </Link>
    <div className="hc-work-row-copy">
      <h3><Link href={`/creations/${work.slug}`}>{work.title}</Link></h3>
      <p>{tab === 'audio' ? work.formats.find((format) => /audio/i.test(format.label))?.note || 'Explore this work’s reading and listening options.' : work.summary || (work.author ? `By ${work.author}` : work.development?.status || 'Explore this creation.')}</p>
      <div className="hc-work-row-actions"><Link href={`/creations/${work.slug}`} className="hc-button hc-button-small">{tab === 'games' ? 'View project' : tab === 'music' ? 'Explore track' : 'Explore book'} <ArrowRight size={13} aria-hidden="true" /></Link>{external && <a href={external.url} className="hc-platform-link" target="_blank" rel="noopener noreferrer">{externalLabel}<span className="sr-only"> (opens a new tab)</span></a>}</div>
    </div>
  </article>;
}

export function HomeExplore({ creations, available }: { creations: Creation[]; available: boolean }) {
  const [selected, setSelected] = useState<TabId>('books');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedWorks = creations.filter((work) => {
    if (selected === 'books') return work.categories.includes('ebooks') && !work.development;
    if (selected === 'audio') return work.categories.includes('audiobooks');
    if (selected === 'music') return work.categories.includes('music') && work.formats.some((format) => format.status === 'published-externally');
    return work.categories.includes('games');
  }).slice(0, 2);
  const music = creations.find((work) => work.slug === 'kitchen-floor-gravity') || creations.find((work) => work.categories.includes('music') && work.links.length > 0);
  const musicUrl = music?.links.find((link) => /youtube\.com\/watch/.test(link.url))?.url;
  const playableGame = creations.find((work) => work.categories.includes('games') && work.formats.some((format) => format.label === 'Free browser demo' && format.status === 'published-externally') && work.links.some((link) => link.format === 'Free browser demo'));
  const game = playableGame || creations.find((work) => work.slug === 'nordic-rush-aurora-relay');
  const gameDemoUrl = playableGame?.links.find((link) => link.format === 'Free browser demo')?.url;
  const gameHref = gameDemoUrl || (game ? `/creations/${game.slug}` : '/creations?category=games');
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); setSelected(tabs[next].id); buttons.current[next]?.focus();
  }
  return <section className="hc-explore" aria-labelledby="explore-title">
    <header className="hc-explore-heading"><h2 id="explore-title"><span className="hc-desktop-explore-label">Explore more creations</span><span className="hc-mobile-explore-label">Explore content</span></h2><div className="hc-tabs" role="tablist" aria-label="Explore digital content">{tabs.map(({ id, label, Icon }, index) => <button key={id} id={`hc-tab-${id}`} type="button" role="tab" aria-selected={selected === id} aria-controls="hc-explore-panel" tabIndex={selected === id ? 0 : -1} onClick={() => setSelected(id)} onKeyDown={(event) => moveTab(event, index)} ref={(node) => { buttons.current[index] = node; }} className={selected === id ? 'hc-tab hc-tab-active' : 'hc-tab'}><Icon size={16} aria-hidden="true" />{label}</button>)}</div><Link href="/creations" className="hc-explore-all">All creations <ArrowRight size={14} aria-hidden="true" /></Link></header>
    <div className="hc-explore-body">
      <div id="hc-explore-panel" role="tabpanel" aria-labelledby={`hc-tab-${selected}`} className="hc-work-list" tabIndex={0}>{selectedWorks.length ? selectedWorks.map((work) => <WorkRow key={`${selected}-${work.slug}`} work={work} tab={selected} />) : <div className="hc-work-empty" role="status"><p>{available ? 'Explore the catalogue for available editions and current projects.' : 'Digital creation information is temporarily unavailable. Please try again later.'}</p><Link href="/creations">Open the catalogue <ArrowRight size={14} aria-hidden="true" /></Link></div>}</div>
      <div className="hc-media-pair">
        <article className="hc-media-card">
          {musicUrl ? <a className="hc-media-image" href={musicUrl} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${music?.title} on YouTube (opens a new tab)`}><Image src="/images/lifestyle/c-music-landscape.webp" alt="Music lifestyle illustration of a bright Nordic landscape" fill sizes="(max-width: 700px) 46vw, 220px" /><span className="hc-media-play"><Play size={15} fill="currentColor" aria-hidden="true" /></span><span className="hc-media-image-note">Music illustration</span></a> : <Link className="hc-media-image" href="/creations?category=music"><Image src="/images/lifestyle/c-music-landscape.webp" alt="Music lifestyle illustration of a bright Nordic landscape" fill sizes="(max-width: 700px) 46vw, 220px" /></Link>}
          <div className="hc-media-copy"><h3>Music</h3><p>{music ? 'Official audio from JKARUU Music.' : 'Explore listening and release information.'}</p><Link href="/creations?category=music">Explore music <ArrowRight size={13} aria-hidden="true" /></Link></div>
        </article>
        <article className="hc-media-card">
          <Link className={`hc-media-image hc-game-image${gameDemoUrl ? ' hc-game-demo' : ''}`} href={gameHref} target={gameDemoUrl ? '_blank' : undefined} rel={gameDemoUrl ? 'noopener noreferrer' : undefined} aria-label={gameDemoUrl ? `Play ${game?.title} free demo (opens a new tab)` : game ? `View ${game.title} project` : 'Explore game projects'}>{game?.cover ? <Image src={game.cover} alt={game.coverAlt} fill sizes="(max-width: 700px) 46vw, 220px" /> : <span className="hc-game-image-empty"><Gamepad2 size={32} strokeWidth={1.4} aria-hidden="true" />Game projects</span>}{gameDemoUrl ? <span className="hc-media-image-note">Actual browser game · Free demo</span> : game?.development?.version && <span className="hc-media-image-note">Actual prototype · {game.development.version}</span>}</Link>
          <div className="hc-media-copy"><h3>{gameDemoUrl ? game?.title : 'Games in development'}</h3><p>{gameDemoUrl ? 'A cozy match-three game. 12 levels to explore.' : game ? game.title : 'Explore our current game projects.'}</p><Link href={gameHref} target={gameDemoUrl ? '_blank' : undefined} rel={gameDemoUrl ? 'noopener noreferrer' : undefined}>{gameDemoUrl ? 'Play free demo' : 'Learn more'} <ArrowRight size={13} aria-hidden="true" />{gameDemoUrl && <span className="sr-only"> (opens a new tab)</span>}</Link></div>
        </article>
      </div>
    </div>
  </section>;
}
