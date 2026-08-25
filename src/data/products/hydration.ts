import type { Product } from './types';

const category = 'hydration-drinkware' as const;
const categoryLabel = 'Hydration & Drinkware';
const categoryPath = ['Products', categoryLabel];

function gallery(slug: string, name: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    src: `/images/products/${slug}/${String(index + 1).padStart(2, '0')}.webp`,
    alt: `${name} product view ${index + 1}`,
    width: 1200,
    height: 1500,
    kind: 'product' as const,
  }));
}

function makeProduct(input: {
  slug: string; sku: string; name: string; shortName: string;
  shortDescription: string; description: string; features: string[];
  applications: string[]; material: string; capacities: string[];
  specifications: Array<{ label: string; value: string }>;
  imageCount: number; featured?: boolean;
}): Product {
  return {
    ...input,
    category,
    categoryLabel,
    categoryPath,
    collection: categoryLabel,
    colors: [],
    sizes: input.capacities,
    customization: [],
    gallery: gallery(input.slug, input.name, input.imageCount),
    documents: [],
    seo: {
      title: `${input.name} | Custom Drinkware | KARUU`,
      description: `${input.shortDescription} Request a sample or product-specific quote from KARUU.`,
      canonical: `https://karuu.net/products/${input.slug}`,
    },
    relatedProducts: [],
    featured: input.featured ?? false,
    published: true,
  };
}

export const hydrationProducts: Product[] = [
  makeProduct({
    slug: 'insulated-carry-bottle-1000ml', sku: 'KHD-0001',
    name: '1,000 ml Insulated Carry Bottle', shortName: 'Insulated Carry Bottle',
    shortDescription: 'A large-capacity stainless-steel bottle with an integrated carry handle for active daily use.',
    description: 'This 1,000 ml bottle supports fitness, wellness, commute, and event programs that need a larger hydration format. Branding, sampling, and commercial terms are confirmed for each project.',
    features: ['1,000 ml documented capacity', 'Integrated carry-handle format', 'Stainless-steel inner and outer construction'],
    applications: ['Fitness', 'Wellness', 'Commute', 'Brand Events'],
    material: '304 stainless-steel inner; 201 stainless-steel outer; 316 stainless-steel base',
    capacities: ['1,000 ml'],
    specifications: [
      { label: 'Capacity', value: '1,000 ml' }, { label: 'Weight', value: '538 g' },
      { label: 'Product dimensions', value: '11 × 11 × 20.5 cm' },
      { label: 'Documented carton quantity', value: '30 units' },
    ], imageCount: 2, featured: true,
  }),
  makeProduct({
    slug: 'handled-travel-tumbler-1200ml', sku: 'KHD-0002',
    name: '1,200 ml Handled Travel Tumbler', shortName: 'Handled Travel Tumbler',
    shortDescription: 'A high-capacity stainless-steel travel tumbler with a side handle and straw-style drinking format.',
    description: 'The 1,200 ml handled tumbler is suited to fitness, commute, retail, and branded event use where capacity and easy carrying matter. Project-specific branding and packaging are confirmed during inquiry review.',
    features: ['1,200 ml documented capacity', 'Side-handle format', 'Stainless-steel inner and outer construction'],
    applications: ['Fitness', 'Commute', 'Retail Programs', 'Brand Events'],
    material: '304 stainless-steel inner; 201 stainless-steel outer', capacities: ['1,200 ml'],
    specifications: [
      { label: 'Capacity', value: '1,200 ml' }, { label: 'Weight', value: '818 g' },
      { label: 'Product dimensions', value: '10 × 15 × 33 cm' },
    ], imageCount: 3, featured: true,
  }),
  makeProduct({
    slug: 'quick-open-insulated-bottle-380ml', sku: 'KHD-0003',
    name: '380 ml Quick-Open Insulated Bottle', shortName: 'Quick-Open Insulated Bottle',
    shortDescription: 'A compact stainless-steel insulated bottle in a quick-open drinking format.',
    description: 'This compact 380 ml format works across yoga, wellness, commute, and retail programs. Available finishes shown in the gallery are visual references; final color and commercial specifications are confirmed per inquiry.',
    features: ['380 ml documented capacity', 'Quick-open format', 'Copper-plated 316 stainless-steel inner'],
    applications: ['Yoga', 'Wellness', 'Commute', 'Retail Programs'],
    material: 'Copper-plated 316 stainless-steel inner; 304 stainless-steel outer', capacities: ['380 ml'],
    specifications: [
      { label: 'Capacity', value: '380 ml' }, { label: 'Weight', value: '255 g' },
      { label: 'Product dimensions', value: '7.7 × 7.7 × 21 cm' },
      { label: 'Documented carton quantity', value: '40 units' },
    ], imageCount: 3, featured: true,
  }),
  makeProduct({
    slug: 'compact-insulated-coffee-tumbler-450ml', sku: 'KHD-0004',
    name: '450 ml Compact Insulated Coffee Tumbler', shortName: 'Compact Coffee Tumbler',
    shortDescription: 'A compact 450 ml stainless-steel tumbler for commute, wellness, and everyday beverage programs.',
    description: 'The compact coffee tumbler provides a lower-profile drinkware option for everyday movement and branded retail programs. Sampling and commercial details are confirmed based on the selected project.',
    features: ['450 ml documented capacity', 'Compact tumbler profile', '304 stainless-steel inner and outer construction'],
    applications: ['Commute', 'Wellness', 'Retail Programs', 'Brand Events'],
    material: '304 stainless-steel inner and outer', capacities: ['450 ml'],
    specifications: [
      { label: 'Capacity', value: '450 ml' }, { label: 'Weight', value: '296 g' },
      { label: 'Documented carton quantity', value: '30 units' },
    ], imageCount: 2,
  }),
  makeProduct({
    slug: 'slim-quick-open-insulated-bottle-450ml', sku: 'KHD-0005',
    name: '450 ml Slim Quick-Open Insulated Bottle', shortName: 'Slim Quick-Open Bottle',
    shortDescription: 'A slim 450 ml insulated bottle for yoga, fitness, wellness, and commute ranges.',
    description: 'This 450 ml slim bottle adds a compact vertical format to active lifestyle collections. Color, branding, packaging, samples, and commercial terms are reviewed for the individual project.',
    features: ['450 ml documented capacity', 'Slim quick-open format', 'Copper-plated 316 stainless-steel inner'],
    applications: ['Yoga', 'Fitness', 'Wellness', 'Commute'],
    material: 'Copper-plated 316 stainless-steel inner; 304 stainless-steel outer', capacities: ['450 ml'],
    specifications: [
      { label: 'Capacity', value: '450 ml' }, { label: 'Weight', value: '293 g' },
      { label: 'Product dimensions', value: '6.7 × 6.7 × 26.2 cm' },
      { label: 'Documented carton quantity', value: '40 units' },
    ], imageCount: 3, featured: true,
  }),
  makeProduct({
    slug: 'carry-loop-insulated-bottle-530ml', sku: 'KHD-0006',
    name: '530 ml Carry-Loop Insulated Bottle', shortName: 'Carry-Loop Insulated Bottle',
    shortDescription: 'A 530 ml stainless-steel bottle with a carry-loop lid for active daily use.',
    description: 'The 530 ml carry-loop bottle is positioned for yoga, fitness, wellness, and commute programs. The gallery shows documented product appearances; final project specifications are confirmed before sampling or quotation.',
    features: ['530 ml documented capacity', 'Carry-loop lid format', 'Stainless-steel inner and outer construction'],
    applications: ['Yoga', 'Fitness', 'Wellness', 'Commute'],
    material: '304 stainless-steel inner; 201 stainless-steel outer', capacities: ['530 ml'],
    specifications: [
      { label: 'Capacity', value: '530 ml' }, { label: 'Weight', value: '335 g' },
      { label: 'Product dimensions', value: '7.2 × 7.2 × 26 cm' },
      { label: 'Documented carton quantity', value: '40 units' },
    ], imageCount: 2,
  }),
  makeProduct({
    slug: 'slim-quick-open-insulated-bottle-600ml', sku: 'KHD-0007',
    name: '600 ml Slim Quick-Open Insulated Bottle', shortName: '600 ml Quick-Open Bottle',
    shortDescription: 'A slim 600 ml stainless-steel insulated bottle for active lifestyle collections.',
    description: 'This 600 ml format extends the slim quick-open range for longer training, commute, and wellness use. Branding, packaging, samples, and production terms are confirmed during project review.',
    features: ['600 ml documented capacity', 'Slim quick-open format', 'Stainless-steel inner and outer construction'],
    applications: ['Fitness', 'Wellness', 'Commute', 'Retail Programs'],
    material: '304 stainless-steel inner; 201 stainless-steel outer', capacities: ['600 ml'],
    specifications: [
      { label: 'Capacity', value: '600 ml' }, { label: 'Weight', value: '331 g' },
      { label: 'Product dimensions', value: '7.2 × 7.2 × 28.1 cm' },
      { label: 'Documented carton quantity', value: '40 units' },
    ], imageCount: 3,
  }),
  makeProduct({
    slug: 'soft-spout-carry-bottle-multi-capacity', sku: 'KHD-0008',
    name: 'Soft-Spout Carry Bottle', shortName: 'Soft-Spout Carry Bottle',
    shortDescription: 'A handled insulated bottle with a soft drinking spout, documented in three capacity options.',
    description: 'This handled soft-spout series supports fitness, wellness, commute, and retail programs. The three documented capacities are treated as variants of one product structure rather than duplicate pages.',
    features: ['Soft-spout drinking format', 'Integrated carry handle', 'Three documented capacity variants'],
    applications: ['Fitness', 'Wellness', 'Commute', 'Retail Programs'],
    material: '304 stainless-steel inner; 201 stainless-steel outer', capacities: ['400 ml', '600 ml', '800 ml'],
    specifications: [
      { label: 'Capacity variants', value: '400 ml / 600 ml / 800 ml' },
      { label: 'Inner material', value: '304 stainless steel' },
      { label: 'Outer material', value: '201 stainless steel' },
    ], imageCount: 3,
  }),
].map((product, index, products) => ({
  ...product,
  relatedProducts: products
    .filter((candidate) => candidate.sku !== product.sku)
    .slice(index % 3, (index % 3) + 3)
    .map((candidate) => candidate.slug),
}));
