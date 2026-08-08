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
import { kr010011 } from './kr01-0011';
import { kr010012 } from './kr01-0012';
import { kr010013 } from './kr01-0013';
import { kr010014 } from './kr01-0014';
import { kr010015 } from './kr01-0015';

// Supplier 2 public catalogue batch: KR02-0001 through KR02-0040.
import {
  kr020001, kr020002, kr020003, kr020004, kr020005, kr020006, kr020007, kr020008,
  kr020009, kr020010, kr020011, kr020012, kr020013, kr020014, kr020015, kr020016,
  kr020017, kr020018, kr020019, kr020020, kr020021, kr020022, kr020023, kr020024,
  kr020025, kr020026, kr020027, kr020028, kr020029, kr020030, kr020031, kr020032,
  kr020033, kr020034, kr020035, kr020036, kr020037, kr020038, kr020039, kr020040,
} from './kr02-batch';
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
  kr010011,
  kr010012,
  kr010013,
  kr010014,
  kr010015,
  kr020001,
  kr020002,
  kr020003,
  kr020004,
  kr020005,
  kr020006,
  kr020007,
  kr020008,
  kr020009,
  kr020010,
  kr020011,
  kr020012,
  kr020013,
  kr020014,
  kr020015,
  kr020016,
  kr020017,
  kr020018,
  kr020019,
  kr020020,
  kr020021,
  kr020022,
  kr020023,
  kr020024,
  kr020025,
  kr020026,
  kr020027,
  kr020028,
  kr020029,
  kr020030,
  kr020031,
  kr020032,
  kr020033,
  kr020034,
  kr020035,
  kr020036,
  kr020037,
  kr020038,
  kr020039,
  kr020040,
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
  'tennis-skirts': 'Tennis Skirts',
  'active-rompers': 'Active Rompers',
};
