import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { formatProductMetadataTitle } from '../src/lib/product-metadata-title.mjs';

const blockedAssets = [
  {
    sourceFile: 'src/data/products/kr01-0005.ts',
    publicFile: 'public/images/products/kr01-0005/03-white-front-back.webp',
  },
];

const violations = [];

for (const asset of blockedAssets) {
  const sourcePath = resolve(asset.sourceFile);
  const publicPath = resolve(asset.publicFile);
  const publicReference = `/${asset.publicFile.replace(/^public\//, '')}`;
  const sourceText = readFileSync(sourcePath, 'utf8');

  if (existsSync(publicPath)) {
    violations.push(`${asset.publicFile} is still publicly deployable`);
  }

  if (sourceText.includes(publicReference) || sourceText.includes(basename(publicPath))) {
    violations.push(`${asset.sourceFile} still references ${publicReference}`);
  }
}

const productTitleCases = [
  [
    "Women's Sleeveless Polo Tennis Dress | KR01-0005 | KARUU",
    "Women's Sleeveless Polo Tennis Dress | KR01-0005 | KARUU",
  ],
  [
    "Women's High-Waist Seamless Performance Shorts | KR01-0015",
    "Women's High-Waist Seamless Performance Shorts | KR01-0015 | KARUU",
  ],
  [
    'Curated Activewear Style | KR02-0001 | KARUU | KARUU',
    'Curated Activewear Style | KR02-0001 | KARUU',
  ],
];

for (const [input, expected] of productTitleCases) {
  const actual = formatProductMetadataTitle(input);
  if (actual !== expected) {
    violations.push(`product title formatter returned "${actual}" instead of "${expected}"`);
  }
}

if (violations.length > 0) {
  console.error('Public product safety check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Public product safety check passed.');
