import type { Product, ProductCategory } from './types';

type Spec = readonly [sku: string, name: string, category: ProductCategory, dimensions: readonly (readonly [number, number])[]];

const categoryMeta: Record<ProductCategory, { label: string; path: string[]; applications: string[] }> = {
  'yoga-leggings': { label: 'Yoga Leggings', path: ['Women', 'Activewear', 'Yoga Leggings'], applications: ['Yoga', 'Studio training', 'Gym training', 'Active everyday wear'] },
  'sports-bra': { label: 'Sports Bras', path: ['Women', 'Activewear', 'Sports Bras'], applications: ['Gym training', 'Yoga', 'Studio training', 'Layered activewear'] },
  'yoga-shorts': { label: 'Yoga Shorts', path: ['Women', 'Activewear', 'Yoga Shorts'], applications: ['Yoga', 'Studio training', 'Active everyday wear'] },
  'yoga-tops': { label: 'Yoga Tops', path: ['Women', 'Activewear', 'Yoga Tops'], applications: ['Yoga', 'Tennis', 'Studio training', 'Active everyday wear'] },
  'outerwear-jackets': { label: 'Outerwear & Jackets', path: ['Women', 'Activewear', 'Outerwear & Jackets'], applications: ['Training', 'Warm-up', 'Active lifestyle'] },
  'activewear-sets': { label: 'Activewear Sets', path: ['Women', 'Activewear', 'Activewear Sets'], applications: ['Gym training', 'Studio training', 'Yoga', 'Private-label activewear collections'] },
  'biker-shorts': { label: 'Biker Shorts', path: ['Women', 'Activewear', 'Biker Shorts'], applications: ['Gym training', 'Studio training', 'Active everyday wear'] },
  'tennis-dresses': { label: 'Tennis Dresses', path: ['Women', 'Tennis', 'Tennis Dresses'], applications: ['Tennis', 'Padel', 'Club training', 'Active lifestyle'] },
  'tennis-skirts': { label: 'Tennis Skirts', path: ['Women', 'Tennis', 'Tennis Skirts'], applications: ['Tennis', 'Padel', 'Club training', 'Active lifestyle'] },
  'active-rompers': { label: 'Active Rompers', path: ['Women', 'Activewear', 'Active Rompers'], applications: ['Studio training', 'Gym training', 'Active lifestyle', 'Athleisure'] },
};

const specs: readonly Spec[] = [
  ['KR02-0001', 'Sculpting High-Waist Seamless Leggings', 'yoga-leggings', [[600,799],[600,799],[600,799],[600,799],[600,799]]],
  ['KR02-0002', 'Leopard Gradient Performance Leggings', 'yoga-leggings', [[800,1066],[800,1066],[800,1067],[800,1067],[800,1067]]],
  ['KR02-0003', 'Lace-Up Side Seamless Leggings', 'yoga-leggings', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0004', 'Flared High-Waist Active Pants', 'yoga-leggings', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0005', 'Pocket Performance Leggings', 'yoga-leggings', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0006', 'Tie-Dye High-Waist Biker Shorts', 'biker-shorts', [[800,800],[800,800],[800,800],[750,1000],[750,1000]]],
  ['KR02-0007', 'Lace-Up Side Seamless Shorts', 'biker-shorts', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0008', 'Side-Cutout Training Shorts', 'biker-shorts', [[3002,4000],[3002,4000],[3002,4000]]],
  ['KR02-0009', 'Contrast-Trim Sculpting Shorts', 'biker-shorts', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0010', 'Contrast-Piping Bra & Shorts Set', 'activewear-sets', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0011', 'Soft-Rib Bra & Shorts Active Set', 'activewear-sets', [[1340,1785],[1340,1785],[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0012', 'Bra & Leggings Training Set', 'activewear-sets', [[800,800],[790,1138],[790,1106],[800,800],[800,800]]],
  ['KR02-0013', 'Long-Sleeve Layered Active Set', 'activewear-sets', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0014', 'Contrast-Piping Bra & Leggings Set', 'activewear-sets', [[1340,1785],[1340,1785],[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0015', 'Square-Neck Short Active Romper', 'active-rompers', [[1340,1785],[1340,1785],[1340,1785],[1785,1785],[1340,1785]]],
  ['KR02-0016', 'Lace-Up Cross-Back Full-Length Jumpsuit', 'active-rompers', [[1340,1785],[1340,1785],[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0017', 'Cutout Side Short Active Romper', 'active-rompers', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0018', 'Twist-Back Printed Short Active Romper', 'active-rompers', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0019', 'Cutout Full-Length Active Jumpsuit', 'active-rompers', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0020', 'Long-Sleeve Cutout Active Jumpsuit', 'active-rompers', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0021', 'Collared Sleeveless Active Crop Top', 'yoga-tops', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0022', 'Open-Back Zip Mock-Neck Crop Top', 'yoga-tops', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0023', 'Cross-Strap Short-Sleeve Tennis Top', 'yoga-tops', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0024', 'Open-Back Long-Sleeve Training Top', 'yoga-tops', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0025', 'Contrast-Seam Long-Sleeve Crop Top', 'yoga-tops', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0026', 'Quarter-Zip Long-Sleeve Training Top', 'yoga-tops', [[1340,1785],[1340,1785],[1200,1200]]],
  ['KR02-0027', 'Lace-Up Front Sports Bra', 'sports-bra', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0028', 'Strappy-Back Support Sports Bra', 'sports-bra', [[1340,1785],[1340,1785],[1200,1200],[1340,1785],[1340,1785]]],
  ['KR02-0029', 'Leopard Multi-Strap Sports Bra', 'sports-bra', [[1200,1200],[1340,1785],[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0030', 'Square-Neck Minimal Sports Bra', 'sports-bra', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0031', 'Adjustable Cross-Back Sports Bra', 'sports-bra', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0032', 'Contrast-Trim Sleeveless Tennis Dress', 'tennis-dresses', [[1200,1200],[1340,1785],[1340,1785]]],
  ['KR02-0033', 'Cross-Back Top & Pleated Tennis Skirt Set', 'tennis-skirts', [[5464,7280],[1340,1785],[5464,7280]]],
  ['KR02-0034', 'Sleeveless Top & Pleated Tennis Skirt Set', 'tennis-skirts', [[671,925],[690,888],[705,948],[690,888],[690,888]]],
  ['KR02-0035', 'Zip Long-Sleeve Top & Tennis Skort Set', 'tennis-skirts', [[1340,1785],[1340,1785],[1340,1785]]],
  ['KR02-0036', 'Collared Top & Pleated Tennis Skirt Set', 'tennis-skirts', [[1340,1785],[1340,1785],[1340,1785]]],
];

function makeProduct([sku, name, category, dimensions]: Spec, index: number): Product {
  const slug = sku.toLowerCase();
  const meta = categoryMeta[category];
  const gallery = dimensions.map(([width, height], imageIndex) => ({
    src: `/images/products/${slug}/${String(imageIndex + 1).padStart(2, '0')}.jpg`,
    alt: `${name} - product view ${imageIndex + 1} - ${sku}`,
    width,
    height,
    kind: imageIndex === dimensions.length - 1 && dimensions.length > 3 ? 'detail' as const : 'model' as const,
  }));
  const relatedProducts = [1, 2, 3].map((offset) => `kr02-${String(((index + offset) % specs.length) + 1).padStart(4, '0')}`);
  return {
    slug,
    sku,
    name,
    shortName: name,
    category,
    categoryLabel: meta.label,
    categoryPath: meta.path,
    collection: 'KARUU Active',
    shortDescription: `Curated buyer-facing ${meta.label.toLowerCase()} style selected for KARUU OEM/ODM and private-label activewear development.`,
    description: `KARUU ${sku} is a curated ${meta.label.toLowerCase()} style selected for international B2B activewear sourcing. The public gallery focuses on garment silhouette, construction details and approved styling views. Material composition, size specification, MOQ, lead time and certification details are confirmed separately during quotation and sampling.`,
    features: [`Distinctive ${name.toLowerCase()} silhouette`, 'Curated buyer-facing product views', 'Suitable for OEM/ODM and private-label project discussion', 'Commercial specifications confirmed during quotation'],
    applications: meta.applications,
    colors: [],
    sizes: [],
    customization: ['OEM/ODM, color, branding and private-label requirements can be reviewed for each project'],
    gallery,
    documents: [],
    seo: { title: `${name} | ${sku}`, description: `Explore KARUU ${sku}, a curated ${meta.label.toLowerCase()} style for OEM/ODM and private-label activewear sourcing.`, canonical: `/products/${slug}` },
    relatedProducts,
    featured: false,
    published: true,
  };
}

const curatedProducts = specs.map(makeProduct);

export const kr020001 = curatedProducts[0];
export const kr020002 = curatedProducts[1];
export const kr020003 = curatedProducts[2];
export const kr020004 = curatedProducts[3];
export const kr020005 = curatedProducts[4];
export const kr020006 = curatedProducts[5];
export const kr020007 = curatedProducts[6];
export const kr020008 = curatedProducts[7];
export const kr020009 = curatedProducts[8];
export const kr020010 = curatedProducts[9];
export const kr020011 = curatedProducts[10];
export const kr020012 = curatedProducts[11];
export const kr020013 = curatedProducts[12];
export const kr020014 = curatedProducts[13];
export const kr020015 = curatedProducts[14];
export const kr020016 = curatedProducts[15];
export const kr020017 = curatedProducts[16];
export const kr020018 = curatedProducts[17];
export const kr020019 = curatedProducts[18];
export const kr020020 = curatedProducts[19];
export const kr020021 = curatedProducts[20];
export const kr020022 = curatedProducts[21];
export const kr020023 = curatedProducts[22];
export const kr020024 = curatedProducts[23];
export const kr020025 = curatedProducts[24];
export const kr020026 = curatedProducts[25];
export const kr020027 = curatedProducts[26];
export const kr020028 = curatedProducts[27];
export const kr020029 = curatedProducts[28];
export const kr020030 = curatedProducts[29];
export const kr020031 = curatedProducts[30];
export const kr020032 = curatedProducts[31];
export const kr020033 = curatedProducts[32];
export const kr020034 = curatedProducts[33];
export const kr020035 = curatedProducts[34];
export const kr020036 = curatedProducts[35];
