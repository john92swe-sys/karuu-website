export type ProductCategory =
  | 'yoga-leggings'
  | 'sports-bra'
  | 'yoga-shorts'
  | 'yoga-tops'
  | 'outerwear-jackets'
  | 'activewear-sets'
  | 'biker-shorts'
  | 'tennis-dresses'
  | 'active-rompers';

export type ProductImageKind =
  | 'product'
  | 'model'
  | 'lifestyle'
  | 'detail'
  | 'color-overview';

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: ProductImageKind;
  color?: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  imageIndex: number;
}

export interface ProductSizeChart {
  image: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductDocument {
  label: string;
  url: string;
  public: boolean;
}

export interface ProductSeo {
  title: string;
  description: string;
  canonical: string;
}

export interface Product {
  slug: string;
  sku: string;
  name: string;
  shortName: string;
  category: ProductCategory;
  categoryLabel: string;
  categoryPath: string[];
  collection: string;
  description: string;
  shortDescription: string;
  features: string[];
  applications: string[];
  colors: ProductColor[];
  sizes: string[];
  material?: string;
  fit?: string;
  neckline?: string;
  sleeve?: string;
  customization: string[];
  moq?: string;
  sampleTime?: string;
  leadTime?: string;
  packaging?: string;
  careInstructions?: string[];
  gallery: ProductImage[];
  sizeChart?: ProductSizeChart;
  documents: ProductDocument[];
  seo: ProductSeo;
  relatedProducts: string[];
  featured: boolean;
  published: boolean;
}
