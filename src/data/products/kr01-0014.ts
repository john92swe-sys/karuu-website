import type { Product } from './types';

const imageBase = '/images/products/kr01-0014';

export const kr010014: Product = {
  slug: 'kr01-0014',
  sku: 'KR01-0014',
  name: "Women's Sleeveless Mock-Neck Half-Zip Tennis Dress",
  shortName: 'Sleeveless Half-Zip Tennis Dress',
  category: 'tennis-dresses',
  categoryLabel: 'Tennis Dresses',
  categoryPath: ['Women', 'Activewear', 'Tennis Dresses'],
  collection: 'KARUU Active',
  shortDescription:
    'Sleeveless tennis and training dress with a mock neck, adjustable half-zip front, fitted waist, A-line skirt, built-in shorts, side pockets, and removable cups.',
  description:
    'A streamlined one-piece tennis and training dress designed for court, studio, and active everyday wear. The sleeveless upper body uses a mock-neck half-zip construction for adjustable coverage, while the fitted waist and A-line skirt create a clean athletic silhouette. Built-in shorts provide additional coverage and include practical side storage, and removable cups support versatile wear. The supplied material records identify a polyamide and elastane blend, but the exact composition is inconsistent across the source documents and should be reconfirmed before production.',
  features: [
    'Sleeveless mock-neck construction',
    'Adjustable half-zip front opening',
    'Fitted waist with A-line skirt silhouette',
    'Built-in shorts for added coverage',
    'Side pockets for small essentials',
    'Removable padded cups',
    'Stretch polyamide and elastane blend',
    'Multi-sport one-piece design',
  ],
  applications: ['Tennis', 'Badminton', 'Studio training', 'Fitness', 'Active everyday wear'],
  colors: [
    { name: 'Mousse Pink', hex: '#dca4ac', imageIndex: 0 },
    { name: 'Linen', hex: '#b9a68f', imageIndex: 2 },
    { name: 'Light Blue', hex: '#b9d7e8', imageIndex: 3 },
    { name: 'Plum Purple', hex: '#76506f', imageIndex: 4 },
    { name: 'Rhino Grey', hex: '#858585', imageIndex: 5 },
    { name: 'Badge Blue', hex: '#263c63', imageIndex: 6 },
    { name: 'Black', hex: '#171717', imageIndex: 7 },
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  material: 'Polyamide / Elastane blend — exact composition to be confirmed',
  fit: 'Fitted upper body and waist with A-line skirt',
  neckline: 'Mock neck with half-zip front',
  sleeve: 'Sleeveless',
  customization: ['Color and branding requirements can be reviewed based on the individual project'],
  gallery: [
    { src: `${imageBase}/01-mousse-pink-front.jpg`, alt: "Mousse pink women's sleeveless half-zip tennis dress front view", width: 1400, height: 1400, kind: 'model', color: 'Mousse Pink' },
    { src: `${imageBase}/02-mousse-pink-back.jpg`, alt: "Mousse pink women's sleeveless tennis dress back view", width: 1200, height: 1800, kind: 'model', color: 'Mousse Pink' },
    { src: `${imageBase}/03-linen-front.jpg`, alt: "Linen women's sleeveless half-zip tennis dress front view", width: 1400, height: 1400, kind: 'model', color: 'Linen' },
    { src: `${imageBase}/04-light-blue-front.jpg`, alt: "Light blue women's sleeveless half-zip tennis dress front view", width: 1400, height: 1400, kind: 'model', color: 'Light Blue' },
    { src: `${imageBase}/05-plum-purple-front.jpg`, alt: "Plum purple women's sleeveless half-zip tennis dress front view", width: 1400, height: 1400, kind: 'model', color: 'Plum Purple' },
    { src: `${imageBase}/06-rhino-grey-front.jpg`, alt: "Rhino grey women's sleeveless half-zip tennis dress front view", width: 1400, height: 1400, kind: 'model', color: 'Rhino Grey' },
    { src: `${imageBase}/07-badge-blue-front.jpg`, alt: "Badge blue women's sleeveless half-zip tennis dress front view", width: 1400, height: 1400, kind: 'model', color: 'Badge Blue' },
    { src: `${imageBase}/08-black-front.jpg`, alt: "Black women's sleeveless half-zip tennis dress front view", width: 1400, height: 1400, kind: 'model', color: 'Black' },
  ],
  documents: [],
  seo: {
    title: "Women's Sleeveless Half-Zip Tennis Dress | KR01-0014",
    description: 'Explore KARUU KR01-0014, a sleeveless half-zip tennis dress with built-in shorts, pockets, removable cups, and an athletic A-line silhouette.',
    canonical: '/products/kr01-0014',
  },
  relatedProducts: ['kr01-0013', 'kr01-0010', 'kr01-0006'],
  featured: false,
  published: true,
};
