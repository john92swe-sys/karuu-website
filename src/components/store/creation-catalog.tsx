'use client';

import { useState } from 'react';
import { Search, Music2, Gamepad2, BookOpen } from 'lucide-react';
import { creationCategories, creations, type Creation, type CreationCategory } from '@/data/creations';
import { CreationCard, styles } from './store-shell';

export function CreationCatalog({ initialCategory = 'all', initialQuery = '', items = creations, unavailable = false }: { initialCategory?: CreationCategory | 'all'; initialQuery?: string; items?: Creation[]; unavailable?: boolean }) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const matches = items.filter((creation) => (category === 'all' || creation.categories.includes(category)) && `${creation.title} ${creation.author || ''} ${creation.summary || ''} ${creation.formats.map((format) => format.label + ' ' + format.note).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  function selectCategory(next: CreationCategory | 'all') {
    setCategory(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', next);
    window.history.replaceState({}, '', url);
  }
  if (unavailable) return <div className={styles.notice} role="alert"><strong>The catalogue is temporarily unavailable.</strong><p>Please try again later. Existing external-platform purchases remain with their platform.</p><a href="/contact" className="underline">Contact KARUU for help</a></div>;
  return <>
    <div className={styles.search}><label htmlFor="creation-search" className="sr-only">Search digital creations</label><div className="relative grow"><Search size={18} className="absolute left-3 top-3.5 text-[#54728c]" aria-hidden="true" /><input id="creation-search" className={`${styles.input} !pl-10`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories, formats or authors" /></div>{query && <button className={styles.buttonOutline} onClick={() => setQuery('')}>Clear</button>}</div>
    <div className={styles.filters} aria-label="Filter creations by category">{creationCategories.map((item) => <button key={item.id} type="button" className={`${styles.filter} ${category === item.id ? styles.filterActive : ''}`} aria-pressed={category === item.id} onClick={() => selectCategory(item.id)}>{item.label}</button>)}</div>
    <p className={styles.resultCount} role="status">{matches.length} {matches.length === 1 ? 'creation' : 'creations'}{query ? ` matching “${query}”` : ''}</p>
    {matches.length ? <div className={styles.grid}>{matches.map((creation) => <CreationCard key={creation.id} creation={creation} />)}</div> : <div className={styles.empty}>{category === 'music' ? <Music2 size={34} className="mx-auto" aria-hidden="true" /> : category === 'games' ? <Gamepad2 size={34} className="mx-auto" aria-hidden="true" /> : <BookOpen size={34} className="mx-auto" aria-hidden="true" />}<h2>{query ? 'No matching creations' : category === 'music' ? 'Music releases' : category === 'games' ? 'Games in development' : 'More editions to come'}</h2><p className={styles.muted}>{query ? 'Try another title or author, or browse all creations.' : category === 'music' ? 'A music release will appear here when its edition and listening options are ready.' : category === 'games' ? 'KARUU game projects are being developed. Published demos, supported platforms and purchase options will be added when available.' : 'New editions and listening options will be listed as they become available.'}</p><button type="button" className={styles.buttonOutline} onClick={() => { setQuery(''); selectCategory('all'); }}>Browse all creations</button></div>}
    {category === 'bundles' && <div className={`${styles.notice} mt-6`}><strong>Read it. Listen to it.</strong><p>Read + listen editions combine the ebook and audiobook of the same work. KARUU orders will open once the included files and editions are ready for direct delivery.</p></div>}
  </>;
}
