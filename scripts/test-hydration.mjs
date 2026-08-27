import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const hydrationSource = readFileSync(join(root, 'src/data/products/hydration.ts'), 'utf8');
const collectionSource = readFileSync(join(root, 'src/app/products/hydration-drinkware/page.tsx'), 'utf8');
const inquirySource = readFileSync(join(root, 'src/components/product-inquiry-form.tsx'), 'utf8');
const catalogueConfigSource = readFileSync(join(root, 'src/config/catalog.ts'), 'utf8');
const homepageSource = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
const navbarSource = readFileSync(join(root, 'src/components/navbar.tsx'), 'utf8');
const footerSource = readFileSync(join(root, 'src/components/footer.tsx'), 'utf8');
const productsPageSource = readFileSync(join(root, 'src/app/products/page.tsx'), 'utf8');
const sitemapSource = readFileSync(join(root, 'src/app/sitemap.ts'), 'utf8');
const productPageSource = readFileSync(join(root, 'src/app/products/[slug]/page.tsx'), 'utf8');

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
  assert.match(inquirySource, /name="productSku"\s+defaultValue=\{product\.sku\}/);
  assert.match(inquirySource, /name="productName"\s+defaultValue=\{product\.name\}/);
  assert.match(inquirySource, /name="productSlug"\s+defaultValue=\{product\.slug\}/);
  assert.doesNotMatch(inquirySource, /type="hidden" name="product(?:Sku|Name|Slug)"/);
});

test('temporary hydration discovery switch is off and reversible', () => {
  assert.match(catalogueConfigSource, /HYDRATION_PUBLICLY_DISCOVERABLE = false/);
  assert.match(homepageSource, /HYDRATION_PUBLICLY_DISCOVERABLE && <HydrationCollectionSection/);
  assert.match(navbarSource, /HYDRATION_PUBLICLY_DISCOVERABLE/);
  assert.match(footerSource, /HYDRATION_PUBLICLY_DISCOVERABLE/);
  assert.match(productsPageSource, /HYDRATION_PUBLICLY_DISCOVERABLE/);
  assert.match(sitemapSource, /HYDRATION_PUBLICLY_DISCOVERABLE/);
});

test('preserved hydration detail URLs are noindex and do not expose related products', () => {
  assert.match(productPageSource, /\? \{ index: false, follow: false \}/);
  assert.match(productPageSource, /publiclyDiscoverableRelatedProducts/);
});
