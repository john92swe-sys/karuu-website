export type CreationCategory = 'ebooks' | 'audiobooks' | 'bundles' | 'music' | 'games';

export type Creation = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  publisher: string | null;
  language: string | null;
  summary: string | null;
  aiDisclosure?: string;
  cover: string | null;
  coverAlt: string;
  development?: { status: string; version: string | null; imageCaption?: string };
  categories: CreationCategory[];
  featured: boolean;
  formats: { label: string; status: 'published-externally' | 'pending'; note: string }[];
  links: { label: string; url: string; format: string; sourceUrl?: string; verifiedAt?: string }[];
  evidence: string[];
};

// Bibliographic content is separate from checkout configuration. A published
// platform edition does not grant KARUU a direct-sale SKU or delivery rights.
export const creations: Creation[] = [
  {
    id: 'key', slug: 'the-key-returned-at-low-tide',
    title: 'The Key Returned at Low Tide', author: 'K. R. Gannet',
    publisher: 'KARUU AB', language: 'English', summary: 'Nell Calder returns to a coastal town to settle her aunt’s repair shop. An old key draws her into a murder investigation. The first Gannetwick mystery.', cover: '/images/creations/low-tide-cover.jpg',
    aiDisclosure: 'The text and cover were created using generative AI.',
    coverAlt: 'The Key Returned at Low Tide — publication cover',
    categories: ['ebooks', 'audiobooks', 'bundles'], featured: true,
    formats: [
      { label: 'Ebook', status: 'published-externally', note: 'Available through Google Play Books.' },
      { label: 'Audiobook', status: 'published-externally', note: 'Google Play edition uses AI narration by Ava (from Google).' },
      { label: 'Read + listen', status: 'pending', note: 'A KARUU ebook and audiobook bundle will be available once both editions can be delivered here.' },
    ],
    links: [
      { label: 'Ebook on Google Play', format: 'Ebook', url: 'https://play.google.com/store/books/details/K_R_Gannet_The_Key_Returned_at_Low_Tide?id=0tQKEgAAQBAJ' },
      { label: 'Audiobook on Google Play', format: 'Audiobook', url: 'https://play.google.com/store/audiobooks/details/K_R_Gannet_The_Key_Returned_at_Low_Tide?id=AQAAAECGxz6HqM' },
      { label: 'View on Payhip', format: 'Ebook', url: 'https://payhip.com/b/49sCR' },
    ],
    evidence: ['Google Play Books edition', 'Google Play audiobook edition'],
  },
  {
    id: 'last-room', slug: 'the-last-room-on-the-register',
    title: 'The Last Room on the Register', author: 'K. R. Gannet', publisher: 'KARUU AB',
    language: 'English (UK)', summary: 'Iris Marlow returns to close a coastal hotel. A visitor writes a dead woman’s name in the register, reopening an old fire and a statement Iris once signed.', cover: '/images/creations/last-room-cover.png',
    aiDisclosure: 'Text and cover were made using generative AI with subsequent revision.',
    coverAlt: 'The Last Room on the Register — publication cover',
    categories: ['ebooks', 'bundles'], featured: true,
    formats: [
      { label: 'Ebook', status: 'published-externally', note: 'Explore the English edition on Kindle or Payhip.' },
      { label: 'Read + listen', status: 'pending', note: 'Audio edition and bundle availability will be confirmed before orders open.' },
    ],
    links: [
      { label: 'View on Kindle', format: 'Ebook', url: 'https://www.amazon.com/dp/B0HK7128ZL' },
      { label: 'View on Payhip', format: 'Ebook', url: 'https://payhip.com/b/dxCwG' },
    ], evidence: ['Recovered original English EPUB', 'Existing digital site catalogue', 'Amazon edition checked 13 October 2026'],
  },
  {
    id: 'witness', slug: 'a-house-for-the-witness',
    title: 'A House for the Witness', author: 'K. R. Gannet', publisher: 'KARUU AB',
    aiDisclosure: 'Text and cover were created using generative AI.',
    language: 'English', summary: 'Mara Ellery finds a copy of her own kitchen inside a stranger’s house, forcing her to question a witness account and her family’s memories.', cover: null,
    coverAlt: 'A House for the Witness — publication cover',
    categories: ['ebooks'], featured: false,
    formats: [{ label: 'Ebook', status: 'published-externally', note: 'Available through Google Play Books.' }],
    links: [
      { label: 'Ebook on Google Play', format: 'Ebook', url: 'https://play.google.com/store/books/details/K_R_Gannet_A_House_for_the_Witness?id=2CQOEgAAQBAJ' },
      { label: 'View on Kindle', format: 'Ebook', url: 'https://www.amazon.com/dp/B0HK61VB5K' },
    ],
    evidence: ['Google Play Books edition'],
  },
  {
    id: 'kitchen-floor-gravity', slug: 'kitchen-floor-gravity', title: 'Kitchen Floor Gravity',
    author: 'J.KARUU', publisher: null, language: null, summary: 'Official audio from JKARUU Music.', cover: null,
    coverAlt: 'Kitchen Floor Gravity', categories: ['music'], featured: false,
    formats: [{ label: 'Online listening', status: 'published-externally', note: 'Listen to the published music video on YouTube.' }],
    links: [{ label: 'Listen on YouTube', format: 'Music', url: 'https://www.youtube.com/watch?v=i6mns_U5nxE' }],
    evidence: ['Existing digital site catalogue, checked 13 October 2026'],
  },
  {
    id: 'neon-finds-the-rain', slug: 'neon-finds-the-rain', title: 'Neon Finds the Rain',
    author: 'J.KARUU', publisher: null, language: null, summary: 'Official audio from JKARUU Music.', cover: null,
    coverAlt: 'Neon Finds the Rain', categories: ['music'], featured: false,
    formats: [{ label: 'Online listening', status: 'published-externally', note: 'Listen to the published music video on YouTube.' }],
    links: [{ label: 'Listen on YouTube', format: 'Music', url: 'https://www.youtube.com/watch?v=bjaTO5DQl2M' }],
    evidence: ['Existing digital site catalogue, checked 13 October 2026'],
  },
];

creations.push({
  id: 'nordic-aurora-relay', slug: 'nordic-rush-aurora-relay', title: 'Nordic Rush: Aurora Relay',
  author: null, publisher: null, language: null, summary: 'A 3D game project in development. The image shown is from the working prototype, not a released game.',
  cover: '/images/creations/nordic-aurora-relay-prototype.png', coverAlt: 'Nordic Rush: Aurora Relay actual v0.1.0 prototype screenshot with Chinese HUD',
  categories: ['games'], featured: false,
  development: { status: 'In development', version: 'v0.1.0', imageCaption: 'Prototype screenshot · v0.1.0 · In development' },
  formats: [{ label: 'Game prototype', status: 'pending', note: 'In development. A public demo, release platforms and purchase options have not been announced.' }],
  links: [], evidence: ['Current Nordic Rush: Aurora Relay project and real rendered prototype, 13 October 2026'],
});


creations.push(
  {
    id: 'xiaoju-escape', slug: 'xiaoju-escape', title: 'Xiaoju Escape',
    author: null, publisher: null, language: null, summary: 'The Xiaoju escape-room game project is in development. Its Harbor Workshop level belongs to this game and is separate from the independent Harbor Workshop project.',
    cover: null, coverAlt: 'Xiaoju Escape project', categories: ['games'], featured: false,
    development: { status: 'In development', version: null },
    formats: [{ label: 'Game project', status: 'pending', note: 'In development. No public demo, purchase or point recharge is available here.' }],
    links: [], evidence: ['Existing digital site and current Godot project, 13 October 2026'],
  },
  {
    id: 'harbor-workshop', slug: 'harbor-workshop', title: 'Harbor Workshop',
    author: null, publisher: null, language: null, summary: 'An independent game project in development. This project is separate from the Harbor Workshop level inside Xiaoju Escape.',
    cover: null, coverAlt: 'Harbor Workshop project', categories: ['games'], featured: false,
    development: { status: 'In development', version: null },
    formats: [{ label: 'Game project', status: 'pending', note: 'In development. No public demo, purchase or point recharge is available here.' }],
    links: [], evidence: ['Existing digital site and current independent Unity project, 13 October 2026'],
  },
  {
    id: 'she-said', slug: 'she-said-the-dead-woman-was-not-her', title: '她说，死的不是她',
    author: '江墨染流年', publisher: null, language: 'Chinese', summary: null, cover: null,
    coverAlt: '她说，死的不是她', aiDisclosure: 'Text produced with generative AI assistance; audio uses speech synthesis.', categories: ['ebooks', 'audiobooks'], featured: false,
    formats: [{ label: 'Online novel', status: 'published-externally', note: 'Read the published serial on Fanqie.' }, { label: 'Audio serial', status: 'published-externally', note: 'Explore the audio edition on Ximalaya. Current episodes and access are managed by the platform.' }],
    links: [{ label: 'Read on Fanqie', format: 'Online novel', url: 'https://fanqienovel.com/page/7694827775856741438' }, { label: 'Listen on Ximalaya', format: 'Audio serial', url: 'https://www.ximalaya.com/album/130061593' }],
    evidence: ['Existing digital site platform catalogue, 13 October 2026'],
  },
  {
    id: 'wanling-shanhe', slug: 'wanling-shanhe', title: '万灵山河',
    author: '江墨染流年', publisher: null, language: 'Chinese', summary: null, cover: null,
    coverAlt: '万灵山河', categories: ['ebooks'], featured: false,
    development: { status: 'In development', version: null },
    formats: [{ label: 'Story in development', status: 'pending', note: 'This work is in development. Publication and reading options will be announced when ready.' }],
    links: [], evidence: ['Existing digital site development catalogue, 13 October 2026'],
  },
  {
    id: 'last-room-zh', slug: 'the-last-room-on-the-register-chinese', title: '登记簿上的最后一间房',
    author: '江墨染流年', publisher: null, language: 'Chinese', summary: 'The Chinese translation of The Last Room on the Register. Publication arrangements are being prepared.',
    cover: null, coverAlt: '登记簿上的最后一间房', aiDisclosure: 'Text and cover created using generative AI.', categories: ['ebooks'], featured: false,
    development: { status: 'Publication in preparation', version: null },
    formats: [{ label: 'Chinese edition', status: 'pending', note: 'Publication arrangements are in preparation. The English edition has separate purchase links.' }],
    links: [], evidence: ['Existing digital site Chinese edition catalogue, 13 October 2026'],
  },
  {
    id: 'second-bowl', slug: 'second-bowl', title: '第二副碗筷',
    author: null, publisher: null, language: 'Chinese', summary: 'A Chinese song in production. A final release and listening link will be added when available.',
    cover: null, coverAlt: '第二副碗筷', categories: ['music'], featured: false,
    development: { status: 'In production', version: null },
    formats: [{ label: 'Music in production', status: 'pending', note: 'There is no final published edition or listening link yet.' }],
    links: [], evidence: ['Existing digital site development catalogue and recovered candidate files, 13 October 2026'],
  },
);

export const featuredCreations = creations.filter((creation) => creation.featured);
export function getCreation(slug: string) {
  return creations.find((creation) => creation.slug === slug || creation.id === slug);
}

export const creationCategories: { id: CreationCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All creations' }, { id: 'ebooks', label: 'Ebooks' },
  { id: 'audiobooks', label: 'Audiobooks' }, { id: 'bundles', label: 'Read + listen' },
  { id: 'music', label: 'Music' }, { id: 'games', label: 'Games' },
];
