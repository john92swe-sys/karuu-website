// Product data model for KARUU Yoga Apparel
// All product images use standard relative paths under /images/products/{sku}/

export type ProductCategory =
  | 'yoga-leggings'
  | 'sports-bra'
  | 'yoga-shorts'
  | 'yoga-tops'
  | 'outerwear-jackets';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

// slug = kebab-case SKU + short name for URL
function makeSlug(sku: string, name: string): string {
  const slugPart = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${sku.toLowerCase()}-${slugPart}`;
}

export interface Product {
  sku: string;
  slug: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  fabric: string;
  composition: string;
  weight: string;
  colors: ProductColor[];
  sizes: string[];
  imageCount: number;
  featured: boolean;
  moq: string;
  features: string[];
  oemOptions: string[];
  certifications: string[];
}

export const categoryLabels: Record<ProductCategory, string> = {
  'yoga-leggings': 'Yoga Leggings',
  'sports-bra': 'Sports Bra',
  'yoga-shorts': 'Yoga Shorts',
  'yoga-tops': 'Yoga Tops',
  'outerwear-jackets': 'Outerwear & Jackets',
};

export const categorySlugs: Record<ProductCategory, string> = {
  'yoga-leggings': 'yoga-leggings',
  'sports-bra': 'sports-bra',
  'yoga-shorts': 'yoga-shorts',
  'yoga-tops': 'yoga-tops',
  'outerwear-jackets': 'outerwear-jackets',
};

// Image path helper
export function getProductImagePath(sku: string, index: number): string {
  return `/images/products/${sku}/${index}.webp`;
}

export function getProductImagePaths(sku: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => getProductImagePath(sku, i + 1));
}

// Product data — KR series yoga apparel
// Placeholder images will be replaced when product packs are uploaded
// slug = kebab-case SKU + short name for URL
function slugFromProduct(sku: string, name: string): string {
  const slugPart = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${sku.toLowerCase()}-${slugPart}`;
}

export const products: Product[] = [
  // KR01001 - Yoga Leggings
  {
    sku: 'KR01001',
    slug: 'kr01001-high-waist-sculpt-yoga-leggings',
    name: 'High-Waist Sculpt Yoga Leggings',
    category: 'yoga-leggings',
    categoryLabel: 'Yoga Leggings',
    shortDescription: 'Buttery-soft high-rise leggings with 4-way stretch and tummy control waistband.',
    description:
      'Our signature high-waist sculpt leggings are designed for maximum comfort during yoga, pilates, and daily wear. Crafted from premium Nylon-Spandex blend with a buttery-soft hand feel, these leggings deliver exceptional stretch, shape retention, and a flattering second-skin fit.',
    fabric: 'Nylon-Spandex Blend',
    composition: '78% Nylon, 22% Spandex',
    weight: '220 gsm',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Charcoal', hex: '#4A4A4A' },
      { name: 'Sage Green', hex: '#9CAF88' },
      { name: 'Rose Taupe', hex: '#B89B8B' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    imageCount: 8,
    featured: true,
    moq: '100 pcs / color',
    features: [
      'Buttery-soft, second-skin feel',
      'High-rise tummy control waistband',
      '4-way stretch for unrestricted movement',
      'Squat-proof opaque fabric',
      'Moisture-wicking and quick-dry',
      'Flatlock seams for chafe-free comfort',
      'Hidden waistband pocket',
    ],
    oemOptions: [
      'Custom logo (heat transfer / screen print / embroidery)',
      'Private label packaging',
      'Custom fabric and color development',
      'Design and pattern modifications',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'ISO 9001', 'BSCI', 'SGS'],
  },

  // KR01002 - Yoga Leggings (Capri)
  {
    sku: 'KR01002',
    slug: 'kr01002-ribbed-high-waist-capri-leggings',
    name: 'Ribbed High-Waist Capri Leggings',
    category: 'yoga-leggings',
    categoryLabel: 'Yoga Leggings',
    shortDescription: 'Textured ribbed capri leggings with compression support and sculpting fit.',
    description:
      'Ribbed texture meets functional design in these capri-length leggings. The ribbed fabric provides gentle compression, enhances muscle support, and adds a stylish textured look. Perfect for yoga, barre, and everyday athleisure.',
    fabric: 'Ribbed Nylon-Spandex',
    composition: '75% Nylon, 25% Spandex',
    weight: '240 gsm',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Cloud Gray', hex: '#B0B7BF' },
      { name: 'Mauve', hex: '#C8A2A2' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    imageCount: 8,
    featured: true,
    moq: '100 pcs / color',
    features: [
      'Ribbed texture for enhanced grip',
      'Compression-fit muscle support',
      'High-rise waist with v-back shaping',
      'Capri length (21" inseam)',
      'Moisture-wicking fabric',
      'Four-way stretch',
      'Seamless gusset',
    ],
    oemOptions: [
      'Custom logo placement',
      'Color customization',
      'Fabric weight adjustment',
      'Packaging customization',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'ISO 9001', 'BSCI'],
  },

  // KR01003 - Sports Bra
  {
    sku: 'KR01003',
    slug: 'kr01003-medium-support-cross-back-sports-bra',
    name: 'Medium Support Cross-Back Sports Bra',
    category: 'sports-bra',
    categoryLabel: 'Sports Bra',
    shortDescription: 'Medium-impact sports bra with cross-back straps and removable padding.',
    description:
      'Versatile medium-support sports bra designed for yoga, pilates, and light-to-moderate training. The cross-back strap design offers freedom of movement, while the soft elastic underband provides comfortable support without digging in.',
    fabric: 'Nylon-Spandex Performance Blend',
    composition: '80% Nylon, 20% Spandex',
    weight: '180 gsm',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'White', hex: '#FAFAFA' },
      { name: 'Dusty Rose', hex: '#D4A5A5' },
      { name: 'Ocean Blue', hex: '#6B8E9F' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    imageCount: 8,
    featured: true,
    moq: '150 pcs / color',
    features: [
      'Medium-impact support',
      'Cross-back strap design',
      'Removable padded cups',
      'Wide elastic underband',
      'Buttery-soft hand feel',
      'Breathable performance fabric',
      'Tag-free for comfort',
    ],
    oemOptions: [
      'Custom logo on strap or band',
      'Adjustable strap option',
      'Custom colors and prints',
      'Eco-friendly fabric option',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'SGS', 'BSCI'],
  },

  // KR01004 - Sports Bra (High Support)
  {
    sku: 'KR01004',
    slug: 'kr01004-high-support-adjustable-sports-bra',
    name: 'High-Support Adjustable Sports Bra',
    category: 'sports-bra',
    categoryLabel: 'Sports Bra',
    shortDescription: 'Maximum-support sports bra with adjustable straps and hook-and-eye closure.',
    description:
      'Engineered for high-impact activities including running, HIIT, and intense training. Provides superior breast support and bounce reduction while maintaining breathability and comfort throughout extended workouts.',
    fabric: 'High-Performance Compression Fabric',
    composition: '76% Polyester, 24% Spandex',
    weight: '260 gsm',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Navy', hex: '#2B3A55' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageCount: 8,
    featured: false,
    moq: '200 pcs / color',
    features: [
      'High-impact maximum support',
      'Adjustable shoulder straps',
      'Hook-and-eye back closure',
      'Molded seamless cups',
      'Breathable mesh panels',
      'Moisture-wicking technology',
      'Chafe-free flatlock seams',
    ],
    oemOptions: [
      'Custom brand label',
      'Colorway customization',
      'Cup size grading',
      'Custom packaging',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'ISO 9001', 'BSCI', 'SGS'],
  },

  // KR01005 - Yoga Shorts
  {
    sku: 'KR01005',
    slug: 'kr01005-high-waist-biker-yoga-shorts',
    name: 'High-Waist Biker Yoga Shorts',
    category: 'yoga-shorts',
    categoryLabel: 'Yoga Shorts',
    shortDescription: '6-inch high-rise biker shorts with compression fit and side pockets.',
    description:
      'Versatile high-waist biker shorts perfect for yoga, spinning, gym sessions, and street style. Features side pockets for phone and essentials, a wide waistband for tummy control, and our signature buttery-soft fabric.',
    fabric: 'Nylon-Spandex Luxury Blend',
    composition: '78% Nylon, 22% Spandex',
    weight: '210 gsm',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Olive', hex: '#6B7B5E' },
      { name: 'Terracotta', hex: '#C67B5B' },
      { name: 'Lavender', hex: '#B8A9C9' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    imageCount: 8,
    featured: true,
    moq: '100 pcs / color',
    features: [
      'High-rise tummy control waistband',
      '6" inseam biker length',
      'Dual side pockets for phone',
      'Buttery-soft lulu-style fabric',
      'Four-way stretch',
      'Squat-proof opaque construction',
      'Gusseted crotch for mobility',
    ],
    oemOptions: [
      'Custom logo (waistband / leg)',
      'Inseam length customization',
      'Color and print development',
      'Private label hang tags',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'ISO 9001', 'BSCI'],
  },

  // KR01006 - Yoga Tops (Long Sleeve)
  {
    sku: 'KR01006',
    slug: 'kr01006-seamless-long-sleeve-yoga-top',
    name: 'Seamless Long Sleeve Yoga Top',
    category: 'yoga-tops',
    categoryLabel: 'Yoga Tops',
    shortDescription: 'Seamless knit long sleeve top with thumbholes and sculpting ribbed panels.',
    description:
      'A sleek, form-fitting long sleeve yoga top crafted with seamless knitting technology. Features strategic ribbed panels for breathability and support, thumbholes to keep sleeves in place, and a stylish cropped hem that pairs perfectly with high-waist leggings.',
    fabric: 'Seamless Nylon Knit',
    composition: '82% Nylon, 18% Spandex',
    weight: '160 gsm',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Cream', hex: '#F5F0E8' },
      { name: 'Sage', hex: '#A8B5A0' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    imageCount: 8,
    featured: false,
    moq: '120 pcs / color',
    features: [
      'Seamless construction for zero chafing',
      'Sculpting ribbed texture panels',
      'Integrated thumbholes',
      'Cropped length (fits at natural waist)',
      'Breathable knit fabric',
      'Four-way stretch',
      'Lightweight and fast-drying',
    ],
    oemOptions: [
      'Custom logo embroidery',
      'Color development',
      'Sleeve length adjustment',
      'Sustainable fabric option (recycled nylon)',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'GRS (upon request)', 'BSCI'],
  },

  // KR01007 - Yoga Tops (Tank)
  {
    sku: 'KR01007',
    slug: 'kr01007-racerback-built-in-bra-yoga-tank',
    name: 'Racerback Built-in Bra Yoga Tank',
    category: 'yoga-tops',
    categoryLabel: 'Yoga Tops',
    shortDescription: '2-in-1 racerback tank with built-in shelf bra for all-day comfort.',
    description:
      'Effortless style meets functional support in this racerback tank top with an integrated shelf bra. Soft, lightweight fabric drapes beautifully while the built-in bra provides light support — perfect for yoga, barre, or layering under a jacket.',
    fabric: 'Tencel™-Nylon Blend',
    composition: '55% Tencel™ Lyocell, 40% Nylon, 5% Spandex',
    weight: '150 gsm',
    colors: [
      { name: 'White', hex: '#FAFAFA' },
      { name: 'Heather Gray', hex: '#9A9EA6' },
      { name: 'Dusty Blue', hex: '#7A8FA3' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    imageCount: 8,
    featured: false,
    moq: '120 pcs / color',
    features: [
      'Built-in shelf bra with removable pads',
      'Racerback design for full range of motion',
      'Soft drapey fit',
      'Tencel™ eco-friendly fiber',
      'Breathable and temperature-regulating',
      'Long length for coverage',
      'Tag-free construction',
    ],
    oemOptions: [
      'Custom label and tag',
      'Fabric composition options',
      'Print and pattern customization',
      'Hem length adjustment',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'Tencel™ Certified', 'BSCI'],
  },

  // KR01008 - Outerwear & Jackets
  {
    sku: 'KR01008',
    slug: 'kr01008-lightweight-zip-up-training-jacket',
    name: 'Lightweight Zip-Up Training Jacket',
    category: 'outerwear-jackets',
    categoryLabel: 'Outerwear & Jackets',
    shortDescription: 'Slim-fit zip-up jacket with thumbholes and side pockets, perfect for warmups.',
    description:
      'A streamlined zip-up training jacket designed to transition seamlessly from studio to street. The slim fit hugs the body without restricting movement, while thumbholes and a standing collar provide extra coverage during warmups and cool-downs.',
    fabric: 'Performance Polyester-Spandex',
    composition: '85% Polyester, 15% Spandex',
    weight: '200 gsm',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Deep Burgundy', hex: '#722F37' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    imageCount: 8,
    featured: true,
    moq: '150 pcs / color',
    features: [
      'Full-zip front with zipper garage',
      'Standing collar',
      'Thumbhole cuffs',
      'Side seam pockets',
      'Slim, tailored fit',
      'Brushed interior for warmth',
      'Reflective logo detail',
    ],
    oemOptions: [
      'Embroidered or printed logo',
      'Custom colorways and fabrics',
      'Hood option',
      'Custom lining options',
    ],
    certifications: ['OEKO-TEX® Standard 100', 'ISO 9001', 'BSCI', 'SGS'],
  },
];

export function getProductBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(limit = 6): Product[] {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getAllCategories(): { slug: ProductCategory; label: string; count: number }[] {
  return (Object.keys(categoryLabels) as ProductCategory[]).map((cat) => ({
    slug: cat,
    label: categoryLabels[cat],
    count: getProductsByCategory(cat).length,
  }));
}

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string): { slug: ProductCategory; label: string; count: number } | undefined {
  return getAllCategories().find((c) => c.slug === slug);
}
