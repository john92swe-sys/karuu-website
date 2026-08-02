import type { Product, ProductCategory } from './types';

export type {
  Product,
  ProductCategory,
  ProductColor,
  ProductDocument,
  ProductImage,
  ProductImageKind,
  ProductSeo,
  ProductSizeChart,
} from './types';

type PublicProductInput = Omit<
  Product,
  'colors' | 'documents' | 'relatedProducts' | 'featured' | 'published'
> &
  Partial<Pick<Product, 'relatedProducts' | 'featured'>>;

function makeProduct(input: PublicProductInput): Product {
  return {
    colors: [],
    documents: [],
    relatedProducts: [],
    featured: false,
    published: true,
    ...input,
  };
}

const kr010001 = makeProduct({
  slug: 'kr01-0001',
  sku: 'KR01-0001',
  name: "Women's Wrap Long Sleeve Active Top",
  shortName: 'Wrap Long Sleeve Active Top',
  category: 'yoga-tops',
  categoryLabel: 'Long Sleeve Yoga Tops',
  categoryPath: ['Women', 'Activewear', 'Yoga Tops', 'Long Sleeve Tops'],
  collection: "Women's Activewear",
  shortDescription:
    'A slim cropped wrap top with a V-neckline and adjustable side tie for yoga, training, and everyday active styling.',
  description:
    'This long sleeve active top combines a wrap-front V-neckline with an adjustable side tie. The lightweight, breathable fabric has a soft hand feel and high stretch for comfortable movement. Its cropped slim fit is designed for yoga, fitness, training, and everyday wear.',
  features: [
    'V-neck wrap-front design',
    'Adjustable side tie',
    'Lightweight and breathable fabric',
    'Soft, skin-friendly hand feel',
    'High stretch for comfortable movement',
    'Slim cropped fit',
    'Long-sleeve coverage',
  ],
  applications: ['Yoga', 'Fitness', 'Training', 'Everyday wear'],
  sizes: ['S', 'M', 'L', 'XL'],
  material: '95% Rayon, 5% Elastane',
  fit: 'Slim cropped fit',
  neckline: 'V-neck wrap design',
  sleeve: 'Long sleeve',
  customization: [
    'Logo requirements can be reviewed by the KARUU team',
    'Label and packaging requirements can be reviewed before quotation',
    'Color requirements are confirmed against available materials',
  ],
  moq: '200 pieces per color',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0001/01-main-pink.webp',
      alt: "Pink women's wrap long sleeve active top, front view",
      width: 679,
      height: 904,
      kind: 'product',
    },
  ],
  seo: {
    title: "Women's Wrap Long Sleeve Active Top | KR01-0001",
    description:
      'Explore KARUU KR01-0001, a women’s wrap long sleeve active top for B2B sourcing, with a V-neckline, adjustable side tie, and sizes S–XL.',
    canonical: '/products/kr01-0001',
  },
  featured: true,
});

const kr010002 = makeProduct({
  slug: 'kr01-0002',
  sku: 'KR01-0002',
  name: "Women's 3-Piece Multi-Style Activewear Set",
  shortName: '3-Piece Multi-Style Activewear Set',
  category: 'activewear-sets',
  categoryLabel: 'Activewear Sets',
  categoryPath: ['Women', 'Activewear', 'Activewear Sets'],
  collection: "Women's Activewear",
  shortDescription:
    'A coordinated three-piece set with a halter tank, adjustable wrap layer, and drawstring wide-leg trousers for active and casual styling.',
  description:
    'This coordinated activewear set combines a halter V-neck tank, a lightweight long-sleeve wrap layer, and high-waist wide-leg trousers. The three pieces can be worn together or separately, with adjustable ties and practical trouser pockets supporting flexible styling for training, studio sessions, and relaxed everyday wear.',
  features: [
    'Three coordinated pieces for flexible styling',
    'Halter V-neck tank with an open-back design',
    'Long-sleeve wrap layer with adjustable side ties',
    'High-waist wide-leg trousers with drawstring adjustment',
    'Practical side pockets',
    'Soft high-stretch fabric',
    'Breathable, moisture-managing construction',
  ],
  applications: ['Yoga', 'Pilates', 'Fitness training', 'Running', 'Loungewear'],
  sizes: ['S', 'M', 'L', 'XL'],
  material: '90% Polyester, 10% Elastane',
  fit: 'Coordinated fitted and relaxed silhouettes',
  neckline: 'Halter V-neck tank',
  sleeve: 'Sleeveless tank with long-sleeve wrap layer',
  customization: [
    'Logo requirements can be reviewed by the KARUU team',
    'Label and packaging requirements can be reviewed before quotation',
    'Color requirements are confirmed against available materials',
  ],
  moq: '200 pieces per color',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0002/01-main-rose-pink.webp',
      alt: "Rose pink women's three-piece activewear set, front view",
      width: 758,
      height: 1152,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's 3-Piece Activewear Set | KR01-0002",
    description:
      'Explore KARUU KR01-0002, a three-piece activewear set with a halter tank, wrap layer, wide-leg trousers, and sizes S–XL.',
    canonical: '/products/kr01-0002',
  },
  relatedProducts: ['kr01-0001', 'kr01-0004'],
  featured: true,
});

const kr010003 = makeProduct({
  slug: 'kr01-0003',
  sku: 'KR01-0003',
  name: "Women's High-Waist Multi-Pocket Biker Shorts",
  shortName: 'High-Waist Multi-Pocket Biker Shorts',
  category: 'biker-shorts',
  categoryLabel: 'Biker Shorts',
  categoryPath: ['Women', 'Activewear', 'Biker Shorts'],
  collection: "Women's Activewear",
  shortDescription:
    'High-waist biker shorts with cargo and back pockets, a V-shaped back waist seam, and a smooth front without a center seam.',
  description:
    'These high-waist biker shorts combine a wide waistband with functional side cargo pockets and two back pockets. A V-shaped back waist seam supports a contoured fit, while the front is constructed without a center seam. The high-stretch fabric is designed for training, cycling, studio activity, and casual activewear styling.',
  features: [
    'Wide high-rise waistband',
    'Functional side cargo pockets',
    'Two back pockets with button closures',
    'V-shaped back waist seam',
    'No front center seam',
    'High-stretch fabric',
    'Reinforced leg openings',
  ],
  applications: ['Yoga', 'Pilates', 'Running', 'Cycling', 'Golf', 'Everyday wear'],
  sizes: ['S', 'M', 'L', 'XL'],
  material: '75% Polyamide, 25% Elastane',
  fit: 'Close-fitting high-waist biker short',
  customization: [
    'Logo requirements can be reviewed by the KARUU team',
    'Label and packaging requirements can be reviewed before quotation',
    'Color requirements are confirmed against available materials',
  ],
  moq: '200 pieces per color',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0003/01-main-black.webp',
      alt: "Black women's high-waist cargo pocket biker shorts, front view",
      width: 672,
      height: 879,
      kind: 'product',
    },
  ],
  seo: {
    title: "Women's Multi-Pocket Biker Shorts | KR01-0003",
    description:
      'Explore KARUU KR01-0003, high-waist biker shorts with cargo pockets, a V-shaped back waist seam, and sizes S–XL.',
    canonical: '/products/kr01-0003',
  },
  relatedProducts: ['kr01-0002', 'kr01-0001'],
});

const kr010004 = makeProduct({
  slug: 'kr01-0004',
  sku: 'KR01-0004',
  name: "Women's Square-Neck Bubble-Hem Tennis Dress",
  shortName: 'Square-Neck Bubble-Hem Tennis Dress',
  category: 'tennis-dresses',
  categoryLabel: 'Tennis Dresses',
  categoryPath: ['Women', 'Activewear', 'Tennis Dresses'],
  collection: "Women's Court Collection",
  shortDescription:
    'A square-neck tennis dress with a shaped bubble hem, coordinated safety shorts, and a practical inner pocket.',
  description:
    'This square-neck athletic dress combines a fitted upper body with a softly shaped bubble hem. Coordinated safety shorts provide additional coverage and include a pocket for small essentials. Wide shoulder straps and a stretch upper fabric support movement for court, studio, and casual activewear use.',
  features: [
    'Square neckline with wide shoulder straps',
    'Fitted upper body',
    'Gathered bubble-hem skirt',
    'Coordinated safety shorts',
    'Pocket for small essentials',
    'Stretch upper-body fabric',
    'Designed for court and studio movement',
  ],
  applications: ['Tennis', 'Pickleball', 'Yoga', 'Fitness training', 'Everyday wear'],
  sizes: ['S', 'M', 'L'],
  material: 'Upper: 80% Polyamide, 20% Elastane; Skirt: 95% Polyester, 5% Elastane',
  fit: 'Fitted upper body with bubble-hem skirt',
  neckline: 'Square neck',
  sleeve: 'Sleeveless',
  customization: [
    'Logo requirements can be reviewed by the KARUU team',
    'Label and packaging requirements can be reviewed before quotation',
    'New color development is reviewed against material minimums',
  ],
  moq: 'Custom colors: 500 pieces per color',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0004/01-main-light-pink.webp',
      alt: "Light pink women's square-neck bubble-hem tennis dress",
      width: 896,
      height: 1200,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's Bubble-Hem Tennis Dress | KR01-0004",
    description:
      'Explore KARUU KR01-0004, a square-neck bubble-hem tennis dress with safety shorts and sizes S–L for B2B sourcing.',
    canonical: '/products/kr01-0004',
  },
  relatedProducts: ['kr01-0005', 'kr01-0006', 'kr01-0007'],
  featured: true,
});

const kr010005 = makeProduct({
  slug: 'kr01-0005',
  sku: 'KR01-0005',
  name: "Women's Sleeveless Polo Tennis Dress & Shorts Set",
  shortName: 'Sleeveless Polo Tennis Dress & Shorts Set',
  category: 'tennis-dresses',
  categoryLabel: 'Tennis Dresses',
  categoryPath: ['Women', 'Activewear', 'Tennis Dresses'],
  collection: "Women's Court Collection",
  shortDescription:
    'A sleeveless polo tennis dress with contrast trim, a half-button placket, pleated skirt, and coordinated safety shorts.',
  description:
    'This two-piece court set pairs a sleeveless polo dress with coordinated safety shorts. Contrast binding defines the polo collar and arm openings, while a half-button placket, shaped waist, and pleated skirt create a clean athletic silhouette for tennis, pickleball, golf, and active everyday wear.',
  features: [
    'Two-piece dress and safety shorts set',
    'Polo collar with contrast binding',
    'Half-button front placket',
    'Sleeveless construction',
    'Shaped waist',
    'Pleated skirt',
    'Coordinated safety shorts for added coverage',
  ],
  applications: ['Tennis', 'Pickleball', 'Golf', 'Yoga', 'Fitness', 'Everyday wear'],
  sizes: ['XS', 'S', 'M', 'L'],
  material: '100% Polyester',
  fit: 'Shaped waist with pleated skirt',
  neckline: 'Polo collar with half-button placket',
  sleeve: 'Sleeveless',
  customization: [
    'Logo requirements can be reviewed by the KARUU team',
    'Label and packaging requirements can be reviewed before quotation',
    'Color development is reviewed against material and trim minimums',
  ],
  moq: 'New production: 500 pieces per color',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0005/01-main-white.webp',
      alt: "White women's sleeveless polo tennis dress, front view",
      width: 800,
      height: 800,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's Sleeveless Polo Tennis Dress | KR01-0005",
    description:
      'Explore KARUU KR01-0005, a sleeveless polo tennis dress and safety shorts set with contrast trim and sizes XS–L.',
    canonical: '/products/kr01-0005',
  },
  relatedProducts: ['kr01-0004', 'kr01-0006', 'kr01-0007'],
});

const kr010006 = makeProduct({
  slug: 'kr01-0006',
  sku: 'KR01-0006',
  name: "Women's Mock-Neck Half-Zip Tennis Dress & Shorts Set",
  shortName: 'Mock-Neck Half-Zip Tennis Dress & Shorts Set',
  category: 'tennis-dresses',
  categoryLabel: 'Tennis Dresses',
  categoryPath: ['Women', 'Activewear', 'Tennis Dresses'],
  collection: "Women's Court Collection",
  shortDescription:
    'A sleeveless mock-neck half-zip tennis dress with contrast piping, fixed bra pads, a pleated A-line skirt, and coordinated safety shorts.',
  description:
    'This two-piece court set pairs a sleeveless half-zip dress with coordinated safety shorts. A shaped upper body, contrast piping, fixed bra pads, and a pleated A-line skirt combine coverage and movement for tennis, badminton, studio training, jogging, and active everyday wear.',
  features: [
    'Two-piece dress and safety shorts set',
    'Mock neck with half-zip opening',
    'Sleeveless construction with contrast piping',
    'Fixed built-in bra pads',
    'Shaped waist',
    'Pleated A-line skirt',
    'Coordinated safety shorts',
  ],
  applications: ['Tennis', 'Badminton', 'Yoga', 'Jogging', 'Fitness', 'Everyday wear'],
  sizes: ['XS', 'S', 'M', 'L'],
  material: 'Upper: 80% Polyamide, 20% Elastane; Skirt: 80% Polyester, 20% Elastane',
  fit: 'Shaped upper body with pleated A-line skirt',
  neckline: 'Mock neck with half-zip opening',
  sleeve: 'Sleeveless',
  customization: [
    'Logo requirements can be reviewed by the KARUU team',
    'Label and packaging requirements can be reviewed before quotation',
    'New color development is reviewed against fabric and trim minimums',
  ],
  moq: 'Custom colors: 500 pieces per color',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0006/01-main-burgundy.webp',
      alt: "Burgundy women's half-zip tennis dress, front view",
      width: 800,
      height: 800,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's Half-Zip Tennis Dress | KR01-0006",
    description:
      'Explore KARUU KR01-0006, a mock-neck half-zip tennis dress and safety shorts set with sizes XS–L.',
    canonical: '/products/kr01-0006',
  },
  relatedProducts: ['kr01-0004', 'kr01-0005', 'kr01-0007'],
  featured: true,
});

const kr010007 = makeProduct({
  slug: 'kr01-0007',
  sku: 'KR01-0007',
  name: "Women's Sleeveless Polo Tie-Waist Tennis Dress & Shorts Set",
  shortName: 'Polo Tie-Waist Tennis Dress & Shorts Set',
  category: 'tennis-dresses',
  categoryLabel: 'Tennis Dresses',
  categoryPath: ['Women', 'Activewear', 'Tennis Dresses'],
  collection: "Women's Court Collection",
  shortDescription:
    'A sleeveless polo tennis dress with a removable waist tie, fixed bra pads, an A-line skirt, and coordinated pocketed safety shorts.',
  description:
    'This two-piece court set pairs a sleeveless polo dress with coordinated safety shorts. The shaped upper body includes fixed bra pads, while an adjustable waist tie and A-line skirt support a flexible fit. The safety shorts include a practical pocket for small essentials.',
  features: [
    'Two-piece dress and safety shorts set',
    'Polo collar',
    'Cap-sleeve effect',
    'Adjustable waist tie',
    'Fixed built-in bra pads',
    'A-line skirt for unrestricted movement',
    'Pocketed safety shorts',
  ],
  applications: ['Tennis', 'Pickleball', 'Yoga', 'Fitness training', 'Everyday wear'],
  sizes: ['XS', 'S', 'M', 'L'],
  fit: 'Shaped upper body with adjustable tie waist and A-line skirt',
  neckline: 'Polo collar',
  sleeve: 'Sleeveless with cap-sleeve effect',
  customization: [
    'Logo requirements can be reviewed by the KARUU team',
    'Label and packaging requirements can be reviewed before quotation',
    'New color development is reviewed against material minimums',
  ],
  moq: 'Custom colors: 200 pieces per color',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0007/01-main-cinnabar-red.webp',
      alt: "Cinnabar red women's polo tie-waist tennis dress, front view",
      width: 800,
      height: 800,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's Polo Tie-Waist Tennis Dress | KR01-0007",
    description:
      'Explore KARUU KR01-0007, a polo tie-waist tennis dress and pocketed safety shorts set with sizes XS–L.',
    canonical: '/products/kr01-0007',
  },
  relatedProducts: ['kr01-0004', 'kr01-0005', 'kr01-0006'],
});

const kr010009 = makeProduct({
  slug: 'kr01-0009',
  sku: 'KR01-0009',
  name: "Women's High-Waist Brushed Flared Yoga Pants",
  shortName: 'High-Waist Brushed Flared Yoga Pants',
  category: 'yoga-leggings',
  categoryLabel: 'Yoga Leggings',
  categoryPath: ['Women', 'Activewear', 'Yoga Leggings'],
  collection: 'KARUU Active',
  shortDescription:
    'High-waist brushed flared yoga pants with four-way stretch, a heart-shaped back seam, and a full-length horseshoe flare.',
  description:
    'This product is made from brushed nylon-spandex fabric with four-way stretch. The wide high waistband, heart-shaped back seam, and flared leg are designed for yoga, training, running, casual wear, and loungewear. Exact fibre percentages and commercial terms are available on request.',
  features: [
    'Wide high-rise waistband',
    'Heart-shaped back seam',
    'Brushed nylon-spandex fabric',
    'Four-way stretch',
    'Soft, skin-friendly hand feel',
    'Breathable and sweat-wicking construction',
    'Horseshoe flared hem',
    'Full-length silhouette',
  ],
  applications: ['Yoga', 'Workout', 'Running', 'Daily casual wear', 'Loungewear'],
  sizes: ['S', 'M', 'L', 'XL'],
  material: 'Brushed nylon-spandex fabric; exact composition percentage available on request',
  fit: 'High waist with a fitted thigh and flared hem',
  customization: [],
  gallery: [
    {
      src: '/images/products/kr01-0009/01-black.jpg',
      alt: "Black women's high-waist brushed flared yoga pants",
      width: 790,
      height: 1108,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's High-Waist Brushed Flared Yoga Pants | KR01-0009",
    description:
      'Explore KARUU KR01-0009, high-waist brushed flared yoga pants with four-way stretch for B2B wholesale and OEM sourcing.',
    canonical: '/products/kr01-0009',
  },
  relatedProducts: ['kr01-0010'],
});

const kr010010 = makeProduct({
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
  sizes: ['S', 'M', 'L', 'XL'],
  material: '80% polyester, 20% elastane',
  fit: 'High waist with rear ruched shaping and a flared leg',
  customization: ['Custom color development subject to order review'],
  moq: '200 pieces per color for custom color orders',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0010/01-black.jpg',
      alt: "Black women's high-waist cargo flared yoga pants",
      width: 1200,
      height: 1801,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's High-Waist Cargo Flared Yoga Pants | KR01-0010",
    description:
      'Explore KARUU KR01-0010, high-waist cargo flared yoga pants with rear ruched shaping, buttoned pockets, and stretch fabric.',
    canonical: '/products/kr01-0010',
  },
  relatedProducts: ['kr01-0009'],
});

const kr010011 = makeProduct({
  slug: 'kr01-0011',
  sku: 'KR01-0011',
  name: "Women's French Halter Active Top",
  shortName: 'French Halter Active Top',
  category: 'yoga-tops',
  categoryLabel: 'Yoga Tops',
  categoryPath: ['Women', 'Activewear', 'Yoga Tops'],
  collection: 'KARUU Active',
  shortDescription:
    'Cropped halter active top with removable pads, an open-back silhouette, and soft four-way stretch fabric.',
  description:
    'This product is a cropped halter active top made from 90% polyamide and 10% elastane. The design combines a halter neckline, open back, removable breathable pads, widened side panels, and a close fit for yoga, gym training, running, and everyday styling.',
  features: [
    '90% polyamide and 10% elastane',
    'Four-way stretch',
    'Soft and lightweight hand feel',
    'Breathable construction',
    'Halter neckline',
    'Open-back design',
    'Removable breathable pads',
    'Widened side panels',
    'Cropped slim fit',
  ],
  applications: ['Yoga', 'Gym training', 'Running', 'Daily active styling'],
  sizes: ['S', 'M', 'L', 'XL'],
  material: '90% polyamide, 10% elastane',
  fit: 'Cropped slim fit',
  customization: ['Custom color development subject to order review'],
  moq: '300 pieces per color for custom color orders',
  packaging: 'Individual poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0011/01-butter-yellow.jpg',
      alt: "Butter yellow women's French halter active top",
      width: 1400,
      height: 1400,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's French Halter Active Top | KR01-0011",
    description:
      'Explore KARUU KR01-0011, a cropped French halter active top with removable pads and four-way stretch for B2B sourcing and OEM/ODM discussions.',
    canonical: '/products/kr01-0011',
  },
  relatedProducts: ['kr01-0001'],
});

const kr010012 = makeProduct({
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
  sizes: ['S', 'M', 'L', 'XL'],
  material: '90% Polyamide, 10% Elastane',
  fit: 'Cropped close fit',
  customization: ['Custom color development subject to order review'],
  moq: '500 pieces per color for custom color orders',
  packaging: 'Poly bag',
  gallery: [
    {
      src: '/images/products/kr01-0012/01-butter-yellow.jpg',
      alt: "Butter yellow women's seamless cropped short-sleeve active T-shirt",
      width: 1400,
      height: 2100,
      kind: 'model',
    },
  ],
  seo: {
    title: "Women's Seamless Cropped Active T-Shirt | KR01-0012",
    description:
      'Explore KARUU KR01-0012, a seamless cropped short-sleeve active T-shirt with four-way stretch and quick-dry performance.',
    canonical: '/products/kr01-0012',
  },
  relatedProducts: ['kr01-0011'],
});

export const products: Product[] = [
  kr010001,
  kr010002,
  kr010003,
  kr010004,
  kr010005,
  kr010006,
  kr010007,
  kr010009,
  kr010010,
  kr010011,
  kr010012,
];

export const categoryLabels: Record<ProductCategory, string> = {
  'yoga-leggings': 'Yoga Leggings',
  'sports-bra': 'Sports Bras',
  'yoga-shorts': 'Yoga Shorts',
  'yoga-tops': 'Yoga Tops',
  'outerwear-jackets': 'Outerwear & Jackets',
  'activewear-sets': 'Activewear Sets',
  'biker-shorts': 'Biker Shorts',
  'tennis-dresses': 'Tennis Dresses',
};
