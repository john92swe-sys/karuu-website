import type Stripe from 'stripe';
import { fail, hash, normalizeCosts, type CostInputs } from './core';
import { actualTaxCostResult, automaticTaxBudget, buildAutomaticTaxCheckoutPreparation, normalizeBillingTaxAddress, verifyAutomaticTaxAccountEvidence, verifyAutomaticTaxAuthorizationTax, type AutomaticTaxPreparation, type AutomaticTaxQuote, type BillingTaxAddress } from './global-tax';

// Preparation only. No create/capture/cancel/refund or database-write capability
// exists here. These ports must be constructed by a trusted server, never input
// from a customer/API request. Production checkout keeps its existing hard lock.
export type TaxPreflightSubject = {
  schemaVersion: number; orderId: string; userId: string; orderRevision: string;
  status: string; taxMode: string; sessionId: string; merchantAccountId: string;
  live: boolean; costRevision: string; policyRevision: string;
  quote: AutomaticTaxQuote; preparation: AutomaticTaxPreparation; costs: CostInputs;
};
type Page<T> = { data: T[]; has_more: boolean };
type ListParams = { limit: number; starting_after?: string; expand?: string[] };
export type TaxPreflightPorts = {
  merchantAccountId: string;
  readSubject(orderId: string, userId: string): Promise<TaxPreflightSubject>;
  resolveMarket(address: BillingTaxAddress, policyRevision: string): Promise<{ addressHash: string; policyRevision: string; territory: string | null; allowed: boolean }>;
  readSession(id: string): Promise<Stripe.Checkout.Session>;
  readIntent(id: string): Promise<Stripe.PaymentIntent>;
  readCharge(id: string): Promise<Stripe.Charge>;
  readTaxSettings(): Promise<Stripe.Tax.Settings>;
  listRegistrations(params: ListParams): Promise<Page<Stripe.Tax.Registration>>;
  listLineItems(id: string, params: ListParams): Promise<Page<Stripe.LineItem>>;
  nowSeconds?: () => number;
};
export type TaxPreflightSnapshot = { version: 'karuu-tax-preflight-v1'; orderId: string; userId: string; subjectHash: string };

function subjectIdentity(subject: TaxPreflightSubject) {
  if (subject.schemaVersion !== 3) fail(503, 'tax_preflight_schema_pending', 'Tax preparation migration and immutable order evidence are required.');
  if (subject.taxMode !== 'stripe_automatic' || subject.status !== 'pending' || !subject.orderRevision || !subject.costRevision || !subject.policyRevision || !/^cs_[a-zA-Z0-9_]+$/.test(subject.sessionId) || !/^acct_[a-zA-Z0-9]+$/.test(subject.merchantAccountId) || subject.quote.orderId !== subject.orderId || subject.quote.userId !== subject.userId) fail(409, 'tax_preflight_subject_invalid', 'Read the exact pending automatic-tax order and its versioned evidence.');
  const costs = normalizeCosts(subject.costs);
  // Validates exact quote/preparation/address and complete review data, without
  // creating a Checkout or invoking the standalone Tax Calculation API.
  buildAutomaticTaxCheckoutPreparation(subject.quote, subject.preparation, 'https://preflight.example.test');
  const budget = automaticTaxBudget(subject.quote.totalMinor, costs, subject.preparation, subject.quote.components.map(value => value.amountMinor));
  if (!budget.complete || !budget.targetMet) fail(503, 'tax_preflight_costs_unconfirmed', 'Complete actual costs and the reviewed before-payment budget must meet the configured target.');
  return hash(JSON.stringify({ ...subject, costs }));
}
export function sealTaxPreflightSnapshot(subject: TaxPreflightSubject): TaxPreflightSnapshot {
  return { version: 'karuu-tax-preflight-v1', orderId: subject.orderId, userId: subject.userId, subjectHash: subjectIdentity(subject) };
}
function objectId(value: string | { id: string } | null) { return typeof value === 'string' ? value : value?.id; }
// Provider/read-port objects can come from shared caches. Retain the values
// actually observed at each read, not aliases that a later await can change.
function detached<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
async function allPages<T extends { id: string }>(read: (params: ListParams) => Promise<Page<T>>, expand?: string[]): Promise<Page<T>> {
  const data: T[] = [], ids = new Set<string>(); let after: string | undefined;
  for (let page = 0; page < 10; page++) {
    const result = detached(await read({ limit: 100, ...(after ? { starting_after: after } : {}), ...(expand ? { expand } : {}) }));
    if (!Array.isArray(result.data) || typeof result.has_more !== 'boolean' || result.data.length > 100 || result.has_more && !result.data.length) fail(503, 'tax_preflight_pagination_invalid', 'The merchant evidence page is invalid or did not advance.');
    for (const item of result.data) {
      if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) fail(503, 'tax_preflight_pagination_invalid', 'Every merchant evidence item must have one unique string identity.');
      ids.add(item.id); data.push(item);
    }
    if (!result.has_more) return { data, has_more: false };
    after = result.data.at(-1)!.id;
  }
  return fail(503, 'tax_preflight_evidence_incomplete', 'The full merchant evidence exceeded the bounded review size.');
}
function authorizationIdentity(subject: TaxPreflightSubject, session: Stripe.Checkout.Session, intent: Stripe.PaymentIntent, charge: Stripe.Charge, now: number) {
  const amount = subject.quote.totalMinor, currency = subject.quote.currency.toLowerCase(), deadline = charge.payment_method_details?.card?.capture_before;
  if (session.id !== subject.sessionId || objectId(session.payment_intent) !== intent.id || intent.livemode !== subject.live || intent.status !== 'requires_capture' || intent.capture_method !== 'manual' || intent.amount !== amount || intent.amount_capturable !== amount || intent.amount_received !== 0 || intent.currency !== currency || intent.metadata.orderId !== subject.orderId || objectId(intent.latest_charge) !== charge.id || charge.livemode !== subject.live || objectId(charge.payment_intent) !== intent.id || charge.amount !== amount || charge.amount_captured !== 0 || charge.currency !== currency || !charge.paid || charge.captured || charge.refunded || charge.amount_refunded !== 0 || charge.payment_method_details?.type !== 'card' || !Number.isSafeInteger(deadline) || deadline! <= now + 60) fail(409, 'tax_preflight_authorization_unconfirmed', 'Read an exact unexpired card authorization with no capture or refund. Other payment methods and partial captures require a separate integration.');
  return { intentId: intent.id, chargeId: charge.id, amountMinor: amount, captureBefore: deadline! };
}

export async function inspectTaxPreflight(snapshot: TaxPreflightSnapshot, ports: TaxPreflightPorts) {
  // Preserve scalar original identity across awaits, even if a caller/cache
  // mutates its own input object while the provider evidence is being read.
  const expected = { ...snapshot };
  if (expected.version !== 'karuu-tax-preflight-v1' || !/^[a-f0-9]{64}$/.test(expected.subjectHash)) fail(409, 'tax_preflight_snapshot_invalid', 'Use the original server-sealed review snapshot.');
  const clock = ports.nowSeconds ?? (() => Math.floor(Date.now() / 1000)), started = clock();
  const subject = detached(await ports.readSubject(expected.orderId, expected.userId));
  if (subject.orderId !== expected.orderId || subject.userId !== expected.userId || subjectIdentity(subject) !== expected.subjectHash || ports.merchantAccountId !== subject.merchantAccountId) fail(409, 'tax_preflight_snapshot_changed', 'The original order, cost, policy or scoped merchant has changed.');
  const session = detached(await ports.readSession(subject.sessionId));
  const address = normalizeBillingTaxAddress(session.customer_details?.address);
  if (hash(JSON.stringify(address)) !== subject.quote.addressHash) fail(409, 'tax_billing_address_changed', 'The authorized billing address differs from the original quote. No payment action was taken.');
  const market = detached(await ports.resolveMarket(address, subject.policyRevision));
  if (market.addressHash !== subject.quote.addressHash || market.policyRevision !== subject.policyRevision || market.allowed !== true || typeof market.territory !== 'string' || !market.territory.trim()) fail(503, 'tax_preflight_market_unconfirmed', 'This exact VAT territory and policy version require a trusted server-side review. A country code alone cannot approve a sale.');
  const settings = detached(await ports.readTaxSettings());
  const registrations = await allPages(params => ports.listRegistrations(params));
  const account = verifyAutomaticTaxAccountEvidence(subject.preparation, address, { settings, registrations }, subject.live, clock());
  const lineItems = await allPages(params => ports.listLineItems(session.id, params), ['data.price.product', 'data.taxes.rate']);
  const tax = verifyAutomaticTaxAuthorizationTax(subject.quote, subject.preparation, session, lineItems, subject.live);
  const intentId = objectId(session.payment_intent);
  if (!intentId) fail(409, 'tax_preflight_authorization_unconfirmed', 'The merchant authorization is missing.');
  const intent = detached(await ports.readIntent(intentId)), chargeId = objectId(intent.latest_charge);
  if (!chargeId) fail(409, 'tax_preflight_authorization_unconfirmed', 'The merchant charge identity is missing.');
  const charge = detached(await ports.readCharge(chargeId)), authorization = authorizationIdentity(subject, session, intent, charge, clock());
  const actual = actualTaxCostResult(subject.quote.totalMinor, tax.tax.taxMinor, normalizeCosts(subject.costs), subject.preparation, subject.quote.components.map(value => value.amountMinor));
  if (!actual.complete || !actual.targetMet) fail(503, 'tax_preflight_costs_unconfirmed', 'The authenticated tax evidence does not meet the configured cost target.');
  const current = detached(await ports.readSubject(expected.orderId, expected.userId));
  const marketNow = detached(await ports.resolveMarket(address, subject.policyRevision)), finished = clock();
  if (subjectIdentity(current) !== expected.subjectHash || ports.merchantAccountId !== subject.merchantAccountId || marketNow.addressHash !== subject.quote.addressHash || marketNow.policyRevision !== subject.policyRevision || marketNow.allowed !== true || typeof marketNow.territory !== 'string' || !marketNow.territory.trim() || JSON.stringify(marketNow) !== JSON.stringify(market) || !Number.isSafeInteger(started) || !Number.isSafeInteger(finished) || finished < started || finished - started > 30) fail(409, 'tax_preflight_snapshot_changed', 'Order inputs, territory policy or review freshness changed while merchant evidence was read.');
  // Evidence is diagnostic, not a durable authorization or a paid tax receipt.
  // A future writer needs locks, operation state, idempotency, fresh rereads and
  // post-capture confirmation before storing tax_receipt or granting content.
  return { decision: 'evidence_checked_execution_locked' as const, executionPermitted: false as const, paymentAction: 'none' as const, phase: 'authorization' as const, subjectHash: expected.subjectHash, evidenceHash: hash(JSON.stringify({ account, tax, authorization, market })), checkedAtSeconds: finished, authorization, taxEvidence: tax, territory: market.territory };
}
