import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const hydrationSource = readFileSync(join(root, 'src/data/products/hydration.ts'), 'utf8');
const collectionSource = readFileSync(join(root, 'src/app/products/hydration-drinkware/page.tsx'), 'utf8');
const inquirySource = readFileSync(join(root, 'src/components/product-inquiry-form.tsx'), 'utf8');

const slugs = [...hydrationSource.matchAll(/slug: '([^']+)'/g)].map((match) => match[1]);
const skus = [...hydrationSource.matchAll(/sku: '(KHD-[0-9]{4})'/g)].map((match) => match[1]);

test('publishes eight unique hydration products', () => {
  assert.equal(slugs.length, 8);
  assert.equal(new Set(slugs).size, 8);
  assert.equal(skus.length, 8);
  assert.equal(new Set(skus).size, 8);
});

test('every hydration product has at least one public image', () => {
  for (const slug of slugs) {
    assert.equal(existsSync(join(root, 'public/images/products', slug, '01.webp')), true, slug);
  }
});

test('public hydration code excludes source identities and price fields', () => {
  const publicText = `${hydrationSource}\n${collectionSource}`;
  for (const forbidden of ['CNY ', 'factory price', 'tax-included price', 'supplier contact']) {
    assert.equal(publicText.includes(forbidden), false, forbidden);
  }
});

test('collection metadata and evidence disclaimers are present', () => {
  assert.match(collectionSource, /Custom Water Bottles & Drinkware \| Private Label \| KARUU/);
  assert.match(collectionSource, /No unverified MOQ is published/);
  assert.match(collectionSource, /BreadcrumbList/);
  assert.match(collectionSource, /FAQPage/);
});

test('product inquiry carries buyer and product context', () => {
  for (const field of ['productSku', 'productName', 'productSlug', 'companyName', 'countryRegion', 'estimatedQuantity', 'brandingRequirement', 'targetLaunchDate', 'businessEmail']) {
    assert.match(inquirySource, new RegExp(`name=\\"${field}\\"`), field);
  }
});
