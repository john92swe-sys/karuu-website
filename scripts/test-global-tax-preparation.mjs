import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { prepareCommerceSchemaMigration } from './lib/commerce-schema-migration.mjs';

// Actual server modules + isolated PostgreSQL-WASM and explicit provider fixtures.
// No credentials, external account, real tax registration, service or transaction.
const root = path.resolve(import.meta.dirname, '..');
const db = new PGlite();
await db.waitReady;
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated');
await db.exec(prepareCommerceSchemaMigration(fs.readFileSync(path.join(root, 'db/001-commerce.sql'), 'utf8')).sql);
await db.exec('SET search_path TO karuu_commerce,pg_catalog,pg_temp');
const migration = fs.readFileSync(path.join(root, 'db/003-global-tax-preparation.sql'), 'utf8');
let merchantCreateCalls = 0;
const sessions = new Map();
const env = { KARUU_RUNTIME: 'node', KARUU_PAYMENT_MODE: 'test', STRIPE_SECRET_KEY: 'rk_test_isolated_fixture_only', STRIPE_WEBHOOK_SECRET: 'whsec_isolated_fixture_only', KARUU_PAYMENTS_ENABLED: 'true', KARUU_SITE_ORIGIN: 'https://karuu.example.test', KARUU_TERMS_VERSION: 'fixture-terms-v1' };
const database = {
  databaseConfigured: async () => true,
  query: async (sql, values = []) => (await db.query(sql, values)).rows,
  transaction: async work => {
    await db.exec('BEGIN');
    try { const result = await work({ query: (sql, values = []) => db.query(sql, values) }); await db.exec('COMMIT'); return result; }
    catch (error) { await db.exec('ROLLBACK'); throw error; }
  },
  audit: (client, actor, action, target, reason, detail) => client.query('INSERT INTO commerce_audit(id,actor_id,action,target,reason,detail) VALUES($1,$2,$3,$4,$5,$6)', [crypto.randomUUID(), actor, action, target, reason, JSON.stringify(detail)]),
};
class FixtureStripe {
  static createFetchHttpClient() { return {}; }
  taxRates = { retrieve: async () => ({ active: true, inclusive: true, percentage: 6, country: 'SE' }) };
  checkout = { sessions: {
    create: async params => {
      merchantCreateCalls++;
      const session = { id: 'cs_fixture_' + crypto.randomUUID(), mode: 'payment', livemode: false, client_reference_id: params.client_reference_id, metadata: params.metadata, amount_total: params.line_items.reduce((sum, line) => sum + line.price_data.unit_amount, 0), currency: params.line_items[0].price_data.currency, payment_status: 'unpaid', status: 'open', url: 'https://checkout.stripe.example.test/fixture', customer_details: { address: { country: 'SE' } }, payment_intent: 'pi_' + crypto.randomUUID() };
      sessions.set(session.id, session); return session;
    },
    retrieve: async id => sessions.get(id),
  } };
  paymentIntents = { retrieve: async id => {
    const session = [...sessions.values()].find(value => value.payment_intent === id);
    return { id, livemode: false, status: 'succeeded', amount: session.amount_total, amount_received: session.amount_total, currency: session.currency, metadata: { orderId: session.metadata.orderId }, latest_charge: { id: 'ch_' + id, livemode: false, paid: true, captured: true, amount: session.amount_total, amount_captured: session.amount_total, currency: session.currency, payment_intent: id } };
  } };
  refunds = { list: async () => ({ data: [], has_more: false }) };
}
const modules = new Map();
function load(name) {
  const filename = path.join(root, 'src/lib/server', name + '.ts');
  if (modules.has(filename)) return modules.get(filename);
  const module = { exports: {} }; modules.set(filename, module.exports);
  const require = dependency => {
    if (dependency === 'node:crypto') return crypto;
    if (dependency === 'stripe') return FixtureStripe;
    if (dependency === './db') return database;
    if (dependency === './auth') return { mailConfigured: async () => false };
    if (dependency === './private-media') return { privateMediaConfigured: async () => true };
    if (dependency === './delivery') return {};
    if (dependency === './works') return {};
    if (dependency.startsWith('./')) return load(dependency.slice(2));
    throw new Error('Unapproved fixture dependency: ' + dependency);
  };
  vm.runInContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, vm.createContext({ module, exports: module.exports, require, process: { env }, Date, Buffer, URL, fetch: () => { throw new Error('External network is forbidden'); } }), { filename });
  modules.set(filename, module.exports); return module.exports;
}
const tax = load('global-tax'), core = load('core'), commerce = load('commerce'), payments = load('payment-reconciliation'), admin = load('admin');
const code = expected => error => error.code === expected;
const copy = value => JSON.parse(JSON.stringify(value));
const review = { reviewedAt: '2020-01-01T00:00:00Z', evidenceReference: 'isolated-fixture-evidence-not-a-business-fact' };
const costs = Object.fromEntries(core.costFields.map(key => [key, key === 'vatRate' ? null : 0]));
function preparation(assetIds = ['ebook-one']) {
  return tax.normalizeAutomaticTaxPreparation({ version: 'karuu-automatic-tax-preparation-v1', components: assetIds.map(assetId => ({ assetId, taxCode: 'txcd_10302000', review })), jurisdictions: [{ country: 'SE', state: null, registrationId: 'taxreg_fixture', registrationCountry: 'SE', registrationType: 'standard', review }], pricing: { mode: 'checkout_automatic', percentFee: 0.005, fixedFeeMinor: 0, inclusiveTaxRateCeiling: 0.3, review }, sandboxReview: review }, assetIds);
}
const address = tax.normalizeBillingTaxAddress({ country: 'SE', line1: 'Fixture Street 1', city: 'Fixture City', postalCode: '12345' });
function quoteFor(prep = preparation(), amounts = [199]) {
  return { orderId: crypto.randomUUID(), userId: crypto.randomUUID(), email: 'fixture@example.test', currency: 'USD', totalMinor: amounts.reduce((sum, value) => sum + value, 0), address, addressHash: core.hash(JSON.stringify(address)), preparationHash: core.hash(JSON.stringify(prep)), components: amounts.map((amountMinor, index) => ({ skuId: 'fixture-sku', assetId: prep.components[index].assetId, title: 'Fixture book', format: 'epub', language: 'en', editionVersion: '1', contentSha256: 'a'.repeat(64), amountMinor, taxCode: prep.components[index].taxCode })) };
}
function receiptFixture(quote, taxAmounts = quote.components.map(() => 11), reason = 'standard_rated') {
  return {
    session: { id: 'cs_fixture_receipt', mode: 'payment', livemode: false, status: 'complete', payment_status: 'paid', client_reference_id: quote.orderId, metadata: { orderId: quote.orderId, userId: quote.userId, taxQuoteHash: tax.automaticTaxQuoteIdentity(quote) }, currency: quote.currency.toLowerCase(), amount_total: quote.totalMinor, automatic_tax: { enabled: true, status: 'complete', liability: { type: 'self' }, provider: 'stripe' }, customer_details: { address: { ...quote.address, postal_code: quote.address.postalCode } }, total_details: { amount_tax: taxAmounts.reduce((sum, value) => sum + value, 0), amount_discount: 0, amount_shipping: 0 } },
    lineItems: { has_more: false, data: quote.components.map((component, index) => ({ id: 'li_fixture_' + index, quantity: 1, currency: quote.currency.toLowerCase(), amount_total: component.amountMinor, amount_discount: 0, amount_tax: taxAmounts[index], price: { unit_amount: component.amountMinor, currency: quote.currency.toLowerCase(), tax_behavior: 'inclusive', product: { id: 'prod_fixture_' + index, tax_code: component.taxCode, metadata: { skuId: component.skuId, assetId: component.assetId, editionVersion: component.editionVersion, contentSha256: component.contentSha256 } } }, taxes: [{ amount: taxAmounts[index], rate: { id: 'txr_fixture', country: 'SE', state: null, percentage: 6, inclusive: true }, taxability_reason: reason, taxable_amount: component.amountMinor - taxAmounts[index] }] })) },
  };
}
async function databaseFixture() {
  const user = { id: crypto.randomUUID(), email: crypto.randomUUID() + '@example.test', role: 'admin', brands: ['karuu'] }, assetId = 'asset-' + crypto.randomUUID(), skuId = 'sku-' + crypto.randomUUID();
  await db.query("INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at,role) VALUES($1,$2,'Fixture','fixture-hash',now(),'admin')", [user.id, user.email]);
  await db.query("INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key,rights_verified,delivery_verified,edition_version,content_sha256) VALUES($1,$1,'Fixture','epub','en',$1,true,true,'1',$2)", [assetId, 'a'.repeat(64)]);
  const sku = { id: skuId, slug: skuId, title: 'Fixture', kind: 'ebook', status: 'active', currency: 'USD', priceMinor: 199, rightsVerified: true, markets: ['SE'], components: [{ assetId, allocationBps: 10000 }], taxByMarket: { SE: { [assetId]: { rate: 0.06, stripeTaxRateId: 'txr_fixture' } } } };
  await admin.adminAction(user, { action: 'save_sku', reason: 'Isolated fixture configuration only', sku });
  await admin.adminAction(user, { action: 'save_cost', reason: 'Isolated fixture costs only', skuId, inputs: { ...costs, vatRate: 0.06 } });
  return { user, skuId, assetId, sku, input: { skuIds: [skuId], market: 'SE', immediateDeliveryConsent: true } };
}

try {
  await test('implementation lock ignores live approval flags and reviewed preparation', () => {
    assert.equal(tax.automaticTaxCheckoutImplemented, false);
    assert.equal(tax.commerceTaxMode(undefined), 'manual_verified');
    assert.doesNotThrow(() => tax.assertManualCheckout('manual_verified'));
    env.KARUU_AUTOMATIC_TAX_ENABLED = 'true'; env.KARUU_TAX_CONFIG_APPROVED = 'true';
    assert.throws(() => tax.assertManualCheckout('stripe_automatic'), code('automatic_tax_checkout_pending'));
    assert.throws(() => tax.assertManualCheckout('invented'), code('tax_mode_unavailable'));
    assert.deepEqual(Array.from(tax.automaticTaxPreparationGaps(preparation(), ['ebook-one'])), []);
  });
  await test('actual address data is required and canonical address/hash distinguishes a state or postal change', () => {
    for (const country of ['US', 'CA', 'IN']) assert.throws(() => tax.normalizeBillingTaxAddress({ country, line1: 'Fixture 1', city: 'Fixture' }), code('billing_tax_address_required'));
    const us = tax.normalizeBillingTaxAddress({ country: 'us', state: 'ca', postal_code: '90001', line1: 'Fixture 1', city: 'Fixture' });
    assert.equal(us.country, 'US'); assert.equal(us.state, 'CA');
    assert.notEqual(core.hash(JSON.stringify(us)), core.hash(JSON.stringify({ ...us, state: 'NY' })));
    assert.throws(() => tax.normalizeBillingTaxAddress({ ...us, line1: 'a'.repeat(201) }), code('invalid_tax_preparation'));
  });
  await test('partial review stays incomplete; no code is guessed and standalone Tax API pricing is rejected', () => {
    const partial = tax.normalizeAutomaticTaxPreparation({}, ['ebook-one']);
    assert.equal(partial.pricing.percentFee, null); assert.equal(tax.automaticTaxPreparationGaps(partial, ['ebook-one']).length, 4);
    assert.throws(() => tax.normalizeAutomaticTaxPreparation({ components: [{ assetId: 'ebook-one', taxCode: 'txcd_00000000' }] }, ['ebook-one']), code('tax_code_unconfirmed'));
    assert.throws(() => tax.normalizeAutomaticTaxPreparation({ pricing: { mode: 'standalone_tax_api' } }, []), code('tax_pricing_unconfirmed'));
    assert.throws(() => tax.automaticTaxBudget(199, costs, partial), code('tax_costs_unconfirmed'));
  });
  await test('actual account evidence needs active, same-mode registrations and exact provincial scope', () => {
    const prep = preparation(), evidence = { settings: { status: 'active', livemode: false, head_office: { address: { country: 'SE' } } }, registrations: { has_more: false, data: [{ id: 'taxreg_fixture', country: 'SE', livemode: false, status: 'active', active_from: 1, expires_at: null, country_options: { se: { type: 'standard' } } }] } };
    assert.equal(tax.verifyAutomaticTaxAccountEvidence(prep, address, evidence, false).registrationId, 'taxreg_fixture');
    for (const altered of [{ ...evidence, settings: { ...evidence.settings, status: 'pending' } }, { ...evidence, registrations: { ...evidence.registrations, has_more: true } }, { ...evidence, registrations: { data: [], has_more: false } }]) assert.throws(() => tax.verifyAutomaticTaxAccountEvidence(prep, address, altered, false));
    assert.throws(() => tax.verifyAutomaticTaxAccountEvidence(prep, address, evidence, true), code('tax_account_evidence_incomplete'));
    const ca = copy(prep); ca.jurisdictions = [{ country: 'CA', state: 'ON', registrationId: 'taxreg_fixture', registrationCountry: 'CA', registrationType: 'province_standard', review }];
    const caAddress = tax.normalizeBillingTaxAddress({ country: 'CA', state: 'ON', postalCode: 'K1A 0B1', line1: 'Fixture 1', city: 'Fixture' });
    const caEvidence = copy(evidence); caEvidence.registrations.data[0].country = 'CA'; caEvidence.registrations.data[0].country_options = { ca: { type: 'province_standard', province_standard: { province: 'BC' } } };
    assert.throws(() => tax.verifyAutomaticTaxAccountEvidence(ca, caAddress, caEvidence, false), code('tax_registration_unconfirmed'));
    caEvidence.registrations.data[0].country_options.ca.province_standard.province = 'ON';
    assert.equal(tax.verifyAutomaticTaxAccountEvidence(ca, caAddress, caEvidence, false).registrationCountry, 'CA');
  });
  await test('prepared Checkout retains exact inclusive allocations and never mixes manual rates or executes the provider', () => {
    const prep = preparation(), quote = quoteFor(prep), before = merchantCreateCalls;
    const params = tax.buildAutomaticTaxCheckoutPreparation(quote, prep, 'https://karuu.example.test');
    assert.equal(params.automatic_tax.enabled, true); assert.equal(params.adaptive_pricing.enabled, false);
    assert.equal(params.line_items[0].price_data.tax_behavior, 'inclusive'); assert.equal(params.line_items[0].price_data.unit_amount, 199);
    assert.equal(params.line_items[0].price_data.product_data.tax_code, 'txcd_10302000'); assert.equal(Object.hasOwn(params.line_items[0], 'tax_rates'), false);
    assert.equal(merchantCreateCalls, before);
    assert.throws(() => tax.buildAutomaticTaxCheckoutPreparation({ ...quote, totalMinor: 200 }, prep, 'https://karuu.example.test'), code('tax_quote_invalid'));
    assert.throws(() => tax.buildAutomaticTaxCheckoutPreparation({ ...quote, addressHash: 'b'.repeat(64) }, prep, 'https://karuu.example.test'), code('tax_quote_changed'));
  });
  await test('actual expanded receipt stores tax breakdown and uses integer gross-minus-tax, without changing quote', () => {
    const prep = preparation(), quote = quoteFor(prep), original = JSON.stringify(quote), fixture = receiptFixture(quote);
    const receipt = tax.verifyAutomaticTaxReceipt(quote, prep, fixture.session, fixture.lineItems, false);
    assert.equal(receipt.grossMinor, 199); assert.equal(receipt.taxMinor, 11); assert.equal(receipt.netMinor, 188);
    assert.equal(receipt.lines[0].taxes[0].rateId, 'txr_fixture'); assert.equal(receipt.lines[0].taxes[0].taxableAmountMinor, 188);
    const result = tax.actualTaxCostResult(199, 11, costs, prep);
    assert.equal(result.netMinor, 188); assert.equal(result.surplusMinor, 187); assert.equal(JSON.stringify(quote), original);
  });
  await test('zero tax is accepted only with supported treatment; missing or not-collecting tax is never approved', () => {
    const prep = preparation(), quote = quoteFor(prep);
    for (const reason of ['not_collecting', 'not_supported', 'reverse_charge', 'customer_exempt', 'future_unknown_reason', null]) {
      const fixture = receiptFixture(quote, [0], reason);
      assert.throws(() => tax.verifyAutomaticTaxReceipt(quote, prep, fixture.session, fixture.lineItems, false), code('tax_treatment_unconfirmed'));
    }
    const zero = receiptFixture(quote, [0], 'zero_rated');
    assert.equal(tax.verifyAutomaticTaxReceipt(quote, prep, zero.session, zero.lineItems, false).taxMinor, 0);
    zero.lineItems.data[0].taxes = [];
    assert.throws(() => tax.verifyAutomaticTaxReceipt(quote, prep, zero.session, zero.lineItems, false), code('tax_line_mismatch'));
  });
  await test('address changes, pending tax state, truncated or altered line identities/totals fail closed', () => {
    const prep = preparation(), quote = quoteFor(prep);
    for (const alter of [fixture => { fixture.session.customer_details.address.postal_code = '99999'; delete fixture.session.customer_details.address.postalCode; }, fixture => { fixture.session.automatic_tax.status = 'requires_location_inputs'; }, fixture => { fixture.lineItems.has_more = true; }, fixture => { fixture.lineItems.data[0].price.product.metadata.contentSha256 = 'b'.repeat(64); }, fixture => { fixture.lineItems.data[0].amount_total = 200; }, fixture => { fixture.session.total_details.amount_tax = 12; }, fixture => { fixture.lineItems.data[0].taxes[0].rate.percentage = Number.NaN; }, fixture => { fixture.lineItems.data[0].taxes[0].rate.id = 'invented'; }]) {
      const fixture = receiptFixture(quote); alter(fixture);
      assert.throws(() => tax.verifyAutomaticTaxReceipt(quote, prep, fixture.session, fixture.lineItems, false));
    }
    const badQuote = { ...quote, totalMinor: 198 }, fixture = receiptFixture(badQuote);
    assert.throws(() => tax.verifyAutomaticTaxReceipt(badQuote, prep, fixture.session, fixture.lineItems, false), code('tax_quote_invalid'));
  });
  await test('multi-component tax and independently rounded fees fit the same conservative before-payment budget', () => {
    const prep = preparation(['one', 'two', 'three']); prep.pricing.inclusiveTaxRateCeiling = 0.1;
    const quote = quoteFor(prep, [100, 100, 100]), maximum = tax.inclusiveTaxCeilingMinor([100, 100, 100], 0.1);
    assert.equal(maximum, 30);
    const fixture = receiptFixture(quote, [10, 10, 10]);
    assert.equal(tax.verifyAutomaticTaxReceipt(quote, prep, fixture.session, fixture.lineItems, false).netMinor, 270);
    for (let gross = 3; gross <= 303; gross++) {
      const amounts = [1, 1, gross - 2], maximumTax = tax.inclusiveTaxCeilingMinor(amounts, 0.1), inputs = { ...costs, percentFees: 0.015 };
      const actual = tax.actualTaxCostResult(gross, maximumTax, inputs, prep, amounts), budget = tax.automaticTaxBudget(gross, inputs, prep, amounts);
      assert.ok(budget.surplusMinor <= actual.surplusMinor, `Budget undercounts separately rounded fees/tax at ${gross}`);
    }
    fixture.lineItems.data[0].amount_tax = 12; fixture.lineItems.data[0].taxes[0].amount = 12; fixture.session.total_details.amount_tax = 32;
    assert.throws(() => tax.verifyAutomaticTaxReceipt(quote, prep, fixture.session, fixture.lineItems, false), code('tax_budget_exceeded'));
  });
  await test('automatic preparation cannot be stored before explicitly applying the new private migration', async () => {
    const fixture = await databaseFixture();
    await assert.rejects(admin.adminAction(fixture.user, { action: 'save_sku', reason: 'Isolated preparation fixture only', sku: { ...fixture.sku, taxMode: 'stripe_automatic', taxByMarket: {}, automaticTaxPreparation: preparation([fixture.assetId]) } }), code('automatic_tax_schema_pending'));
    assert.equal((await db.query('SELECT tax_by_market FROM commerce_skus WHERE id=$1', [fixture.skuId])).rows[0].tax_by_market.SE[fixture.assetId].rate, 0.06);
  });
  await test('unapplied migration is repeatable in the fixture and preserves manual rows, RLS and original tax quote/receipt', async () => {
    const fixture = await databaseFixture(), before = (await db.query('SELECT price_minor,components,tax_by_market FROM commerce_skus WHERE id=$1', [fixture.skuId])).rows[0];
    await db.exec(migration); await db.exec(migration);
    const after = (await db.query('SELECT * FROM commerce_skus WHERE id=$1', [fixture.skuId])).rows[0];
    assert.equal(after.tax_mode, 'manual_verified'); assert.deepEqual({ price_minor: after.price_minor, components: after.components, tax_by_market: after.tax_by_market }, before);
    assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='karuu_commerce.commerce_orders'::regclass")).rows[0].relrowsecurity, true);
    const id = crypto.randomUUID(), snapshot = [{ skuId: fixture.skuId, components: [{ assetId: fixture.assetId }] }];
    await db.query("INSERT INTO commerce_orders(id,user_id,idempotency_key,request_hash,status,currency,total_minor,market,snapshot,consent_version,consent_at,tax_mode,tax_quote) VALUES($1,$2,$3,'fixture','pending','USD',199,'SE',$4,'fixture',now(),'stripe_automatic',$5)", [id, fixture.user.id, crypto.randomUUID(), JSON.stringify(snapshot), JSON.stringify({ original: 'quote' })]);
    await db.query('UPDATE commerce_orders SET tax_receipt=$2 WHERE id=$1', [id, JSON.stringify({ original: 'receipt' })]);
    for (const update of ["tax_quote='{}'", "tax_receipt='{}'", "tax_mode='manual_verified'"]) await assert.rejects(db.query('UPDATE commerce_orders SET ' + update + ' WHERE id=$1', [id]), error => error.code === '23514');
    assert.equal((await db.query('SELECT tax_quote,tax_receipt FROM commerce_orders WHERE id=$1', [id])).rows[0].tax_quote.original, 'quote');
  });
  await test('even fully reviewed automatic SKUs stay unavailable, create no order/session and reject mixed manual rates', async () => {
    const fixture = await databaseFixture();
    await assert.rejects(admin.adminAction(fixture.user, { action: 'save_sku', reason: 'Isolated tax fixture only', sku: { ...fixture.sku, taxMode: 'stripe_automatic', automaticTaxPreparation: preparation([fixture.assetId]) } }), code('mixed_tax_modes'));
    await admin.adminAction(fixture.user, { action: 'save_sku', reason: 'Isolated tax preparation only', sku: { ...fixture.sku, taxMode: 'stripe_automatic', taxByMarket: {}, automaticTaxPreparation: preparation([fixture.assetId]) } });
    const item = (await commerce.catalog()).items.find(value => value.id === fixture.skuId); assert.equal(item.available, false); assert.equal(item.priceMinor, null);
    assert.ok(!JSON.stringify(item).includes(review.evidenceReference));
    const before = merchantCreateCalls;
    await assert.rejects(commerce.checkout(fixture.user, fixture.input, crypto.randomUUID()), code('automatic_tax_checkout_pending'));
    assert.equal(merchantCreateCalls, before); assert.equal((await db.query('SELECT id FROM commerce_orders WHERE user_id=$1', [fixture.user.id])).rows.length, 0);
    await assert.rejects(admin.adminAction(fixture.user, { action: 'save_sku', reason: 'Isolated old editor fixture', sku: { ...fixture.sku, taxByMarket: {} } }), code('tax_mode_confirmation_required'));
  });
  await test('manual checkout still resumes its session and rejects a provider automatic-tax mismatch before exposing the URL', async () => {
    const fixture = await databaseFixture(), first = await commerce.checkout(fixture.user, fixture.input, crypto.randomUUID()), before = merchantCreateCalls;
    const again = await commerce.checkout(fixture.user, fixture.input, crypto.randomUUID()); assert.equal(first.orderId, again.orderId); assert.equal(merchantCreateCalls, before);
    const session = [...sessions.values()].find(value => value.metadata.orderId === first.orderId); session.automatic_tax = { enabled: true };
    await assert.rejects(commerce.checkout(fixture.user, fixture.input, crypto.randomUUID()), code('checkout_session_mismatch'));
  });
  await test('manual payment with an automatic-tax provider receipt rolls back event and grants no entitlement', async () => {
    const fixture = await databaseFixture(), first = await commerce.checkout(fixture.user, fixture.input, crypto.randomUUID());
    const session = [...sessions.values()].find(value => value.metadata.orderId === first.orderId); session.payment_status = 'paid'; session.status = 'complete'; session.automatic_tax = { enabled: true, status: 'complete' };
    const eventId = 'evt_' + crypto.randomUUID();
    await assert.rejects(payments.processPaymentEvent({ id: eventId, type: 'checkout.session.completed', livemode: false, data: { object: session } }), code('manual_tax_receipt_mismatch'));
    assert.equal((await db.query('SELECT status FROM commerce_orders WHERE id=$1', [first.orderId])).rows[0].status, 'pending');
    assert.equal((await db.query('SELECT id FROM commerce_payment_events WHERE id=$1', [eventId])).rows.length, 0);
    assert.equal((await db.query('SELECT asset_id FROM commerce_entitlements WHERE order_id=$1', [first.orderId])).rows.length, 0);
  });
} finally { await db.close(); }
console.log('Verification boundary: pure preparation + PostgreSQL-WASM + merchant fixtures. No real Stripe Tax, sandbox/live payment, registration or deployment occurred.');
