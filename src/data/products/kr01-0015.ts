import type { Product } from './types';

const imageBase = '/images/products/kr01-0015';

export const kr010015: Product = {
  slug: 'kr01-0015',
  sku: 'KR01-0015',
  name: "Women's High-Waist Seamless Performance Shorts",
  shortName: 'High-Waist Seamless Performance Shorts',
  category: 'biker-shorts',
  categoryLabel: 'Biker Shorts',
  categoryPath: ['Women', 'Activewear', 'Biker Shorts'],
  collection: 'KARUU Active',
  shortDescription:
    'High-waist seamless athletic shorts in a soft 90% polyamide and 10% elastane stretch fabric with a wide waistband and flat leg openings.',
  description:
    'These women’s high-waist seamless athletic shorts are made from a 90% polyamide and 10% elastane functional stretch fabric. The wide high-rise waistband is designed for close support without excessive pinching, while flat seamless leg openings help reduce rolling during movement. The body-contouring construction supports unrestricted motion for gym training, running, yoga, cycling, and active everyday wear.',
  features: [
    '90% polyamide and 10% elastane',
    'Seamless body-contouring construction',
    'Wide high-rise waistband',
    'Flat leg-opening construction',
    'Four-way stretch performance',
    'Lightweight and breathable hand feel',
    'Designed for unrestricted movement',
    'Versatile training and everyday silhouette',
  ],
  applications: ['Gym training', 'Yoga', 'Running', 'Cycling', 'Active everyday wear'],
  colors: [
    { name: 'Ink Blue', hex: '#7ca0b6', imageIndex: 0 },
    { name: 'Copper Brown', hex: '#9b5141', imageIndex: 2 },
    { name: 'Pearl Pink', hex: '#e8b8bd', imageIndex: 4 },
    { name: 'Butter Yellow', hex: '#ece49a', imageIndex: 6 },
    { name: 'Midnight Black', hex: '#162238', imageIndex: 7 },
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  material: '90% Polyamide, 10% Elastane',
  fit: 'Close body-contouring high-waist fit',
  customization: ['Color and branding requirements can be reviewed based on the individual project'],
  gallery: [
    { src: `${imageBase}/01-ink-blue-front.jpg`, alt: "Ink blue women's high-waist seamless performance shorts front view", width: 1350, height: 1800, kind: 'model', color: 'Ink Blue' },
    { src: `${imageBase}/02-ink-blue-side.jpg`, alt: "Ink blue women's high-waist seamless performance shorts side view", width: 1350, height: 1800, kind: 'model', color: 'Ink Blue' },
    { src: `${imageBase}/03-copper-front.jpg`, alt: "Copper brown women's high-waist seamless performance shorts front view", width: 1350, height: 1800, kind: 'model', color: 'Copper Brown' },
    { src: `${imageBase}/04-copper-motion.jpg`, alt: "Copper brown women's seamless performance shorts movement view", width: 1350, height: 1800, kind: 'lifestyle', color: 'Copper Brown' },
    { src: `${imageBase}/05-pearl-pink-front.jpg`, alt: "Pearl pink women's high-waist seamless performance shorts front view", width: 1350, height: 1800, kind: 'model', color: 'Pearl Pink' },
    { src: `${imageBase}/06-pearl-pink-detail.jpg`, alt: "Pearl pink women's seamless performance shorts side construction detail", width: 1400, height: 1400, kind: 'detail', color: 'Pearl Pink' },
    { src: `${imageBase}/07-butter-yellow-front.jpg`, alt: "Butter yellow women's high-waist seamless performance shorts front view", width: 1350, height: 1800, kind: 'model', color: 'Butter Yellow' },
    { src: `${imageBase}/08-midnight-black-detail.jpg`, alt: "Midnight black women's high-waist seamless performance shorts side view", width: 1400, height: 1400, kind: 'detail', color: 'Midnight Black' },
  ],
  documents: [],
  seo: {
    title: "Women's High-Waist Seamless Performance Shorts | KR01-0015",
    description: 'Explore KARUU KR01-0015, high-waist seamless athletic shorts in a 90% polyamide and 10% elastane stretch fabric for training and activewear programs.',
    canonical: '/products/kr01-0015',
  },
  relatedProducts: ['kr01-0011', 'kr01-0012', 'kr01-0013'],
  featured: false,
  published: true,
};
