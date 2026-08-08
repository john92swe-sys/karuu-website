import type { Product } from './types';

const imageBase = '/images/products/kr01-0010';

export const kr010010: Product = {
  slug: 'kr01-0010',
  sku: 'KR01-0010',
  name: "Women's High-Waist Cargo Flared Yoga Pants",
  shortName: 'High-Waist Cargo Flared Yoga Pants',
  category: 'yoga-leggings',
  categoryLabel: 'Yoga Leggings',
  categoryPath: ['Women', 'Activewear', 'Yoga Leggings'],
  collection: 'KARUU Active',
  shortDescription:
    'Lightweight high-waist flared yoga pants with ruched shaping and two buttoned back cargo pockets.',
  description:
    'This product combines lightweight stretch fabric with a high-rise waist, rear ruched shaping, two buttoned back pockets, and a flared-leg silhouette. The supplied specification lists 80% polyester and 20% elastane, with sizes S to XL. Designed for yoga, exercise, daily wear, and loungewear.',
  features: [
    'High-rise waistband with tummy support',
    'Rear ruched shaping detail',
    'Two buttoned back pockets',
    'Lightweight and breathable fabric',
    'Soft, skin-friendly hand feel',
    'High-stretch construction',
    'Flared-leg silhouette',
    'Suitable for sports and daily wear',
  ],
  applications: ['Yoga', 'Workout', 'Daily casual wear', 'Loungewear'],
  colors: [],
  sizes: ['S', 'M', 'L', 'XL'],
  material: '80% polyester, 20% elastane',
  fit: 'High waist with rear ruched shaping and a flared leg',
  customization: ['Custom color development subject to order review'],
  moq: '200 pieces per color for custom color orders',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: `${imageBase}/01-black.jpg`,
      alt: "Black women's high-waist cargo flared yoga pants",
      width: 1200,
      height: 1801,
      kind: 'model',
    },
    {
      src: `${imageBase}/02-army-green.jpg`,
      alt: "Army green women's high-waist cargo flared yoga pants",
      width: 1200,
      height: 1600,
      kind: 'model',
    },
    {
      src: `${imageBase}/03-cocoa.jpg`,
      alt: "Cocoa women's high-waist cargo flared yoga pants",
      width: 1200,
      height: 1600,
      kind: 'model',
    },
    {
      src: `${imageBase}/04-wine-red.jpg`,
      alt: "Wine red women's high-waist cargo flared yoga pants",
      width: 1200,
      height: 1812,
      kind: 'model',
    },
    {
      src: `${imageBase}/05-turquoise-blue.jpg`,
      alt: "Turquoise blue women's high-waist cargo flared yoga pants",
      width: 1200,
      height: 1812,
      kind: 'model',
    },
    {
      src: `${imageBase}/06-light-gray.jpg`,
      alt: "Light gray women's high-waist cargo flared yoga pants",
      width: 1200,
      height: 1600,
      kind: 'model',
    },
  ],
  documents: [],
  seo: {
    title: "Women's High-Waist Cargo Flared Yoga Pants | KR01-0010",
    description:
      'Explore KARUU KR01-0010 high-waist cargo flared yoga pants with rear ruched shaping, buttoned pockets, and stretch fabric.',
    canonical: '/products/kr01-0010',
  },
  relatedProducts: ['kr01-0009', 'kr01-0008'],
  featured: false,
  published: true,
};
