import { kr010001 } from './kr01-0001';
import { kr010002 } from './kr01-0002';
import { kr010003 } from './kr01-0003';
import { kr010004 } from './kr01-0004';
import { kr010005 } from './kr01-0005';
import { kr010006 } from './kr01-0006';
import { kr010007 } from './kr01-0007';
import { kr010008 } from './kr01-0008';
import { kr010009 } from './kr01-0009';
import { kr010010 } from './kr01-0010';
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

export const products: Product[] = [
  kr010001,
  kr010002,
  kr010003,
  kr010004,
  kr010005,
  kr010006,
  kr010007,
  kr010008,
  kr010009,
  kr010010,
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
