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
const mixedStyleSource = readFileSync(join(root, 'src/components/mixed-style-collection.tsx'), 'utf8');
const contactSource = readFileSync(join(root, 'src/components/contact-form.tsx'), 'utf8');
const moqConfigSource = readFileSync(join(root, 'src/config/mixed-style-moq.ts'), 'utf8');
const activewearDataSource = [
  ...Array.from({ length: 15 }, (_, index) => `src/data/products/kr01-${String(index + 1).padStart(4, '0')}.ts`),
  'src/data/products/kr02-batch.ts',
].map((path) => readFileSync(join(root, path), 'utf8')).join('\n');

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

test('activewear MOQ wording uses the approved series-level statement', () => {
  assert.match(moqConfigSource, /Starting MOQ: 200 pieces per product series, with styles mixable within the same series/);
  assert.match(productPageSource, /ACTIVEWEAR_MOQ_STATEMENT/);
  assert.doesNotMatch(activewearDataSource, /\b\d+\s*(?:pieces|pcs)\s*(?:per|\/)\s*colou?r/i);
  assert.doesNotMatch(activewearDataSource, /MOQ\s*:?\s*200\s*(?:pieces|pcs)?\s*(?:per|\/)\s*colou?r/i);
});

test('mixed-style module provides three bounded procurement scenarios', () => {
  for (const scenario of [
    'Yoga Studio & Teacher Training Capsule',
    'Pilates & Barre Studio Capsule',
    'Emerging Activewear Brand Capsule',
  ]) {
    assert.match(mixedStyleSource, new RegExp(scenario));
  }
  assert.match(mixedStyleSource, /do not indicate all pieces are available together in a single 200-piece\s+order/);
  assert.match(mixedStyleSource, /View the Full KARUU Catalogue/);
});

test('collection-plan form stays low-friction and accurately describes email delivery', () => {
  for (const field of [
    'companyName', 'contactName', 'businessEmail', 'countryRegion', 'businessType', 'message',
    'intendedUse', 'instructorStaffWear', 'memberRetail', 'teacherTraining', 'privateLabel',
    'estimatedQuantity', 'preferredProductCategories', 'representativeStyles',
    'targetLaunchDate', 'brandingRequirement',
  ]) {
    assert.match(contactSource, new RegExp(`name=\"${field}\"`), field);
  }
  assert.match(contactSource, /<details/);
  assert.match(contactSource, /does not store this form/);
  assert.match(contactSource, /Request a Mixed-Style Collection Plan/);
});
