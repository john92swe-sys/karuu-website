import type { Product } from './types';

const imageBase = '/images/products/kr01-0012';

export const kr010012: Product = {
  slug: 'kr01-0012',
  sku: 'KR01-0012',
  name: "Women's Seamless Cropped Short-Sleeve Active T-Shirt",
  shortName: 'Seamless Cropped Active T-Shirt',
  category: 'yoga-tops',
  categoryLabel: 'Yoga Tops',
  categoryPath: ['Women', 'Activewear', 'Yoga Tops'],
  collection: 'KARUU Active',
  shortDescription:
    'Seamless cropped short-sleeve active T-shirt with four-way stretch, moisture-wicking performance, and a close athletic fit.',
  description:
    'This product is a seamless cropped short-sleeve active T-shirt made from 90% polyamide and 10% elastane. The soft four-way stretch fabric, breathable quick-dry performance, crew neckline, and fitted cropped silhouette support yoga, running, gym training, and everyday activewear styling.',
  features: [
    '90% polyamide and 10% elastane',
    'Seamless knitted construction',
    'Four-way stretch',
    'Soft skin-friendly hand feel',
    'Moisture-wicking performance',
    'Breathable and quick-dry fabric',
    'Classic crew neckline',
    'Cropped fitted silhouette',
  ],
  applications: ['Yoga', 'Running', 'Gym training', 'Daily active styling'],
  colors: [],
  sizes: ['S', 'M', 'L', 'XL'],
  material: '90% Polyamide, 10% Elastane',
  fit: 'Cropped close fit',
  customization: ['Custom color development subject to order review'],
  moq: '500 pieces per color for custom color orders',
  packaging: 'Poly bag',
  gallery: [
    {
      src: `${imageBase}/01-butter-yellow.jpg`,
      alt: "Butter yellow women's seamless cropped short-sleeve active T-shirt",
      width: 1400,
      height: 2100,
      kind: 'model',
    },
    {
      src: `${imageBase}/02-light-pink.jpg`,
      alt: "Light pink women's seamless cropped short-sleeve active T-shirt",
      width: 1400,
      height: 2100,
      kind: 'model',
    },
    {
      src: `${imageBase}/03-cornflower-blue.jpg`,
      alt: "Cornflower blue women's seamless cropped short-sleeve active T-shirt",
      width: 1400,
      height: 2100,
      kind: 'model',
    },
    {
      src: `${imageBase}/04-black.jpg`,
      alt: "Black women's seamless cropped short-sleeve active T-shirt",
      width: 1400,
      height: 2100,
      kind: 'model',
    },
    {
      src: `${imageBase}/05-mocha.jpg`,
      alt: "Mocha women's seamless cropped short-sleeve active T-shirt",
      width: 1400,
      height: 2100,
      kind: 'model',
    },
    {
      src: `${imageBase}/06-slate-gray.jpg`,
      alt: "Slate gray women's seamless cropped short-sleeve active T-shirt",
      width: 1400,
      height: 2100,
      kind: 'model',
    },
    {
      src: `${imageBase}/07-detail-seamless-knit.jpg`,
      alt: 'Seamless knit construction detail for this KARUU product',
      width: 1400,
      height: 2100,
      kind: 'detail',
    },
    {
      src: `${imageBase}/08-detail-fabric-stretch.jpg`,
      alt: 'Four-way stretch fabric detail for this KARUU product',
      width: 1400,
      height: 2100,
      kind: 'detail',
    },
  ],
  documents: [],
  seo: {
    title: "Women's Seamless Cropped Active T-Shirt | KR01-0012",
    description:
      'Explore KARUU KR01-0012 seamless cropped short-sleeve active T-shirt with four-way stretch and quick-dry performance.',
    canonical: '/products/kr01-0012',
  },
  relatedProducts: ['kr01-0011'],
  featured: false,
  published: true,
};
