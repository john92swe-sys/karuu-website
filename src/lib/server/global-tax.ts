import type Stripe from 'stripe';
import { amount, costFields, costResult, type CostInputs, fail, hash, identifier } from './core';

// This preparation is deliberately not a charge-capable integration. A stored
// review, environment flag or successful pure validation cannot remove this lock.
export const automaticTaxCheckoutImplemented = false;
export type CommerceTaxMode = 'manual_verified' | 'stripe_automatic';
export function commerceTaxMode(value: unknown): CommerceTaxMode {
  if (value == null || value === 'manual_verified') return 'manual_verified';
  if (value === 'stripe_automatic') return value;
  return fail(503, 'tax_mode_unavailable', 'The product tax integration is not configured.');
}
export function assertManualCheckout(mode: unknown): void {
  if (commerceTaxMode(mode) !== 'manual_verified') fail(503, 'automatic_tax_checkout_pending', 'Direct purchase for this edition is awaiting its verified international tax and payment integration. No payment has been started.');
}

// Exact candidate codes read from Stripe's canonical list on 2026-10-14. A code
// is not approved for a SKU until its actual delivery rights have been reviewed.
export const digitalTaxCodeCandidates = [
  { code: 'txcd_10302000', label: 'Digital Books - downloaded - non subscription - with permanent rights' },
  { code: 'txcd_10302001', label: 'Digital Books - downloaded - non subscription - with limited rights' },
  { code: 'txcd_10301000', label: 'Audiobook' },
] as const;
const supportedCode = (code: string) => digitalTaxCodeCandidates.some(candidate => candidate.code === code);
type Review = { reviewedAt: string | null; evidenceReference: string | null };
export type AutomaticTaxPreparation = {
  version: 'karuu-automatic-tax-preparation-v1';
  components: { assetId: string; taxCode: string; review: Review }[];
  jurisdictions: { country: string; state: string | null; registrationId: string; registrationCountry: string; registrationType: string; review: Review }[];
  pricing: { mode: 'checkout_automatic'; percentFee: number | null; fixedFeeMinor: number | null; inclusiveTaxRateCeiling: number | null; review: Review };
  sandboxReview: Review;
};
export type BillingTaxAddress = { country: string; state: string | null; postalCode: string | null; line1: string; line2: string | null; city: string };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_tax_preparation', 'Use a structured tax preparation record.');
  return value as Record<string, unknown>;
}
function boundedText(value: unknown, maximum: number): string {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) fail(400, 'invalid_tax_preparation', 'Tax evidence and address fields must contain bounded plain text.');
  return value.trim();
}
function country(value: unknown): string {
  const code = boundedText(value, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) fail(400, 'billing_country_required', 'Provide the actual two-letter billing country.');
  // Syntax is not market approval or an assertion that Stripe Tax supports it.
  return code;
}
function review(value: unknown): Review {
  const input = object(value ?? {}), reviewedAt = boundedText(input.reviewedAt, 50) || null, evidenceReference = boundedText(input.evidenceReference, 500) || null;
  if (reviewedAt && (!Number.isFinite(Date.parse(reviewedAt)) || Date.parse(reviewedAt) > Date.now())) fail(400, 'invalid_tax_review', 'A tax review must have a valid completed date.');
  return { reviewedAt, evidenceReference };
}
const reviewed = (value: Review) => Boolean(value.reviewedAt && value.evidenceReference);
function ratio(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1) fail(400, 'invalid_tax_budget', 'Tax and fee ratios must be verified decimal values below one.');
  return value;
}
export function normalizeBillingTaxAddress(value: unknown): BillingTaxAddress {
  const input = object(value), result = { country: country(input.country), state: boundedText(input.state, 80).toUpperCase() || null, postalCode: boundedText(input.postalCode ?? input.postal_code, 30).toUpperCase() || null, line1: boundedText(input.line1, 200), line2: boundedText(input.line2, 200) || null, city: boundedText(input.city, 100) };
  if (!result.line1 || !result.city || (['US', 'CA', 'IN'].includes(result.country) && (!result.state || !result.postalCode))) fail(400, 'billing_tax_address_required', 'Provide the actual billing address, including state or province and postal code where required.');
  return result;
}
export function normalizeAutomaticTaxPreparation(value: unknown, assetIds: string[]): AutomaticTaxPreparation {
  const input = object(value ?? {});
  if (input.version != null && input.version !== 'karuu-automatic-tax-preparation-v1') fail(400, 'invalid_tax_preparation', 'This tax preparation version is not supported.');
  const componentValues = input.components ?? [], jurisdictionValues = input.jurisdictions ?? [];
  if (!Array.isArray(componentValues) || componentValues.length > assetIds.length || !Array.isArray(jurisdictionValues) || jurisdictionValues.length > 500) fail(400, 'invalid_tax_preparation', 'List bounded component and jurisdiction reviews.');
  const components = componentValues.map(value => {
    const component = object(value), assetId = identifier(component.assetId), taxCode = boundedText(component.taxCode, 30);
    if (!assetIds.includes(assetId) || !supportedCode(taxCode)) fail(400, 'tax_code_unconfirmed', 'Use an exact reviewed digital-book or audiobook code from the canonical tax-code list.');
    return { assetId, taxCode, review: review(component.review) };
  });
  if (new Set(components.map(component => component.assetId)).size !== components.length) fail(400, 'invalid_tax_preparation', 'Review each included asset once.');
  const jurisdictions = jurisdictionValues.map(value => {
    const jurisdiction = object(value), registrationId = boundedText(jurisdiction.registrationId, 100), registrationType = boundedText(jurisdiction.registrationType, 80);
    if (!/^taxreg_[a-zA-Z0-9]+$/.test(registrationId) || !registrationType) fail(400, 'registration_evidence_required', 'Record an existing registration identity, scheme and its reviewed coverage.');
    return { country: country(jurisdiction.country), state: boundedText(jurisdiction.state, 80).toUpperCase() || null, registrationId, registrationCountry: country(jurisdiction.registrationCountry), registrationType, review: review(jurisdiction.review) };
  });
  if (new Set(jurisdictions.map(value => `${value.country}:${value.state ?? ''}`)).size !== jurisdictions.length) fail(400, 'invalid_tax_preparation', 'Each exact jurisdiction may have only one coverage review.');
  const pricing = object(input.pricing ?? {});
  if (pricing.mode != null && pricing.mode !== 'checkout_automatic') fail(400, 'tax_pricing_unconfirmed', 'This preparation supports only reviewed Checkout automatic-tax pricing; it does not execute or budget standalone Tax API calls.');
  return { version: 'karuu-automatic-tax-preparation-v1', components, jurisdictions, pricing: { mode: 'checkout_automatic', percentFee: ratio(pricing.percentFee), fixedFeeMinor: amount(pricing.fixedFeeMinor, true), inclusiveTaxRateCeiling: ratio(pricing.inclusiveTaxRateCeiling), review: review(pricing.review) }, sandboxReview: review(input.sandboxReview) };
}
export function automaticTaxPreparationGaps(preparation: AutomaticTaxPreparation, assetIds: string[]): string[] {
  const gaps: string[] = [];
  if (!assetIds.length || assetIds.some(id => !preparation.components.some(component => component.assetId === id && reviewed(component.review)))) gaps.push('component_tax_classification');
  if (!preparation.jurisdictions.length || preparation.jurisdictions.some(jurisdiction => !reviewed(jurisdiction.review))) gaps.push('actual_registration_and_jurisdiction_coverage');
  if (preparation.pricing.percentFee == null || preparation.pricing.fixedFeeMinor == null || preparation.pricing.inclusiveTaxRateCeiling == null || !reviewed(preparation.pricing.review)) gaps.push('tax_service_cost_and_before_payment_budget');
  if (!reviewed(preparation.sandboxReview)) gaps.push('separate_sandbox_verification');
  return gaps;
}

export type AutomaticTaxAccountEvidence = { settings: Stripe.Tax.Settings; registrations: { data: Stripe.Tax.Registration[]; has_more: boolean } };
export function verifyAutomaticTaxAccountEvidence(preparation: AutomaticTaxPreparation, address: BillingTaxAddress, evidence: AutomaticTaxAccountEvidence, live: boolean, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (evidence.settings.status !== 'active' || !evidence.settings.head_office?.address?.country || evidence.settings.livemode !== live || evidence.registrations.has_more) fail(503, 'tax_account_evidence_incomplete', 'Read the active merchant tax settings and complete registration records before quoting.');
  const jurisdiction = preparation.jurisdictions.find(value => value.country === address.country && value.state === address.state) ?? preparation.jurisdictions.find(value => value.country === address.country && value.state === null && !['US', 'CA', 'IN'].includes(value.country));
  if (!jurisdiction || !reviewed(jurisdiction.review)) fail(503, 'tax_jurisdiction_unreviewed', 'This exact billing jurisdiction has no reviewed registration coverage.');
  const registration = evidence.registrations.data.find(value => value.id === jurisdiction.registrationId);
  const options = registration?.country_options as Record<string, { type?: string; state?: string; province_standard?: { province?: string } }> | undefined;
  const setting = options?.[jurisdiction.registrationCountry.toLowerCase()];
  if (!registration || registration.country !== jurisdiction.registrationCountry || registration.livemode !== live || registration.status !== 'active' || registration.active_from > nowSeconds || registration.expires_at != null && registration.expires_at <= nowSeconds || setting?.type !== jurisdiction.registrationType || registration.country === 'US' && setting.state !== address.state || registration.country === 'CA' && setting?.type === 'province_standard' && setting.province_standard?.province !== address.state) fail(503, 'tax_registration_unconfirmed', 'The current merchant registration does not match the reviewed identity, scheme, dates and coverage.');
  // A cross-country OSS review remains an accounting assertion, not an automatic
  // deduction from a VAT number or origin-country registration. The final Stripe
  // tax reason must independently confirm actual supported tax treatment.
  return { registrationId: registration.id, registrationCountry: registration.country, registrationType: jurisdiction.registrationType, coverageReview: jurisdiction.review, settingsCountry: evidence.settings.head_office.address.country };
}
export type AutomaticTaxQuote = {
  orderId: string; userId: string; email: string; currency: string; totalMinor: number;
  address: BillingTaxAddress; addressHash: string; preparationHash: string;
  components: { skuId: string; assetId: string; title: string; format: string; language: string; editionVersion: string; contentSha256: string; amountMinor: number; taxCode: string }[];
};
export function automaticTaxQuoteIdentity(quote: AutomaticTaxQuote): string {
  return hash(JSON.stringify({ orderId: quote.orderId, userId: quote.userId, currency: quote.currency, totalMinor: quote.totalMinor, addressHash: quote.addressHash, preparationHash: quote.preparationHash, components: quote.components }));
}
function verifyQuoteStructure(quote: AutomaticTaxQuote, preparation: AutomaticTaxPreparation) {
  amount(quote.totalMinor);
  if (!quote.components.length || quote.components.length > 100 || new Set(quote.components.map(component => component.assetId)).size !== quote.components.length || quote.components.reduce((sum, component) => sum + component.amountMinor, 0) !== quote.totalMinor || !['SEK', 'EUR', 'USD', 'GBP'].includes(quote.currency)) fail(400, 'tax_quote_invalid', 'The immutable component allocation and currency must match the original total.');
  if (hash(JSON.stringify(normalizeBillingTaxAddress(quote.address))) !== quote.addressHash || hash(JSON.stringify(preparation)) !== quote.preparationHash) fail(409, 'tax_quote_changed', 'The billing address or reviewed tax preparation differs from the original quote.');
  for (const component of quote.components) {
    amount(component.amountMinor);
    if (component.amountMinor <= 0 || !/^[a-f0-9]{64}$/.test(component.contentSha256) || !preparation.components.some(value => value.assetId === component.assetId && value.taxCode === component.taxCode)) fail(400, 'tax_quote_invalid', 'Quote each exact edition with its reviewed tax code and positive allocation.');
  }
}
export function inclusiveTaxCeilingMinor(componentAmounts: number[], rate: number): number {
  ratio(rate);
  if (!componentAmounts.length) fail(400, 'tax_quote_invalid', 'The tax budget needs the exact positive component allocations.');
  return componentAmounts.reduce((sum, value) => {
    amount(value);
    if (value <= 0) fail(400, 'tax_quote_invalid', 'Every component allocation must be positive.');
    return sum + Math.ceil(value - value / (1 + rate));
  }, 0);
}
export function automaticTaxBudget(priceMinor: number, inputs: CostInputs, preparation: AutomaticTaxPreparation, componentAmounts = [priceMinor]) {
  if (preparation.pricing.percentFee == null || preparation.pricing.fixedFeeMinor == null || preparation.pricing.inclusiveTaxRateCeiling == null || !reviewed(preparation.pricing.review)) fail(503, 'tax_costs_unconfirmed', 'An approved Checkout tax-service cost and conservative tax budget are required before payment.');
  if (inputs.percentFees == null || inputs.fixedPayment == null) fail(503, 'costs_incomplete', 'Payment costs remain unknown.');
  // Checkout tax fees are budgeted explicitly on top of ordinary payment fees.
  // Per-order Tax API fees are not hidden here; no Tax Calculation API is called.
  const combinedPercent = inputs.percentFees + preparation.pricing.percentFee;
  if (combinedPercent >= 1) fail(503, 'tax_costs_unconfirmed', 'The combined fee budget cannot support this checkout.');
  inclusiveTaxCeilingMinor(componentAmounts, preparation.pricing.inclusiveTaxRateCeiling);
  if (componentAmounts.reduce((sum, value) => sum + value, 0) !== priceMinor) fail(400, 'tax_quote_invalid', 'Tax budgeting must use the exact quoted component amounts.');
  const roundingReserve = inputs.percentFees > 0 && preparation.pricing.percentFee > 0 ? 1 : 0;
  // Separate inclusive component rounding can consume up to n-1 additional
  // minor units beyond the single-rate aggregate formula used by legacy costs.
  const componentRoundingReserve = componentAmounts.length - 1;
  return costResult(priceMinor, { ...inputs, vatRate: preparation.pricing.inclusiveTaxRateCeiling, percentFees: combinedPercent, fixedPayment: inputs.fixedPayment + preparation.pricing.fixedFeeMinor + roundingReserve + componentRoundingReserve });
}
export function buildAutomaticTaxCheckoutPreparation(quote: AutomaticTaxQuote, preparation: AutomaticTaxPreparation, origin: string): Stripe.Checkout.SessionCreateParams {
  if (automaticTaxPreparationGaps(preparation, quote.components.map(component => component.assetId)).length) fail(503, 'tax_preparation_incomplete', 'Complete and verify the tax preparation before creating provider parameters.');
  const site = new URL(origin);
  if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash || site.pathname !== '/') fail(503, 'tax_checkout_origin_invalid', 'Use the exact approved HTTPS store origin.');
  verifyQuoteStructure(quote, preparation);
  // This only builds parameters. Nothing calls stripe.checkout.sessions.create.
  // Hosted Checkout can change the address: preventing an unapproved changed
  // jurisdiction before capture is an unresolved release dependency.
  return { mode: 'payment', customer_email: quote.email, billing_address_collection: 'required', adaptive_pricing: { enabled: false }, automatic_tax: { enabled: true, liability: { type: 'self' } }, client_reference_id: quote.orderId,
    metadata: { orderId: quote.orderId, userId: quote.userId, taxQuoteHash: automaticTaxQuoteIdentity(quote) }, payment_intent_data: { metadata: { orderId: quote.orderId } },
    success_url: `${site.origin}/account?checkout=return&order=${encodeURIComponent(quote.orderId)}`, cancel_url: `${site.origin}/bag?checkout=cancel`,
    line_items: quote.components.map(component => ({ quantity: 1, price_data: { currency: quote.currency.toLowerCase(), unit_amount: component.amountMinor, tax_behavior: 'inclusive', product_data: { name: `${component.title} — ${component.format} (${component.language})`, tax_code: component.taxCode, metadata: { skuId: component.skuId, assetId: component.assetId, editionVersion: component.editionVersion, contentSha256: component.contentSha256 } } } })),
  };
}
export type AutomaticTaxReceipt = { sessionId: string; quoteHash: string; billingAddressHash: string; currency: string; grossMinor: number; taxMinor: number; netMinor: number; lines: { assetId: string; amountMinor: number; taxMinor: number; reasons: string[]; taxCode: string; taxes: { rateId: string; country: string | null; state: string | null; percentage: number; taxableAmountMinor: number | null; reason: string; amountMinor: number }[] }[] };
const acceptedTaxReasons = new Set(['standard_rated', 'reduced_rated', 'zero_rated', 'product_exempt', 'not_subject_to_tax', 'portion_product_exempt', 'portion_reduced_rated', 'portion_standard_rated', 'proportionally_rated', 'taxable_basis_reduced']);
export function verifyAutomaticTaxReceipt(quote: AutomaticTaxQuote, preparation: AutomaticTaxPreparation, session: Stripe.Checkout.Session, lineItems: { data: Stripe.LineItem[]; has_more: boolean }, live: boolean): AutomaticTaxReceipt {
  verifyQuoteStructure(quote, preparation);
  const quoteHash = automaticTaxQuoteIdentity(quote);
  if (session.livemode !== live || session.mode !== 'payment' || session.status !== 'complete' || session.payment_status !== 'paid' || session.client_reference_id !== quote.orderId || session.metadata?.orderId !== quote.orderId || session.metadata?.userId !== quote.userId || session.metadata?.taxQuoteHash !== quoteHash || session.currency?.toUpperCase() !== quote.currency || session.amount_total !== quote.totalMinor || !session.automatic_tax?.enabled || session.automatic_tax.status !== 'complete' || session.automatic_tax.liability?.type !== 'self' || session.automatic_tax.provider !== 'stripe') fail(409, 'tax_receipt_unconfirmed', 'The authenticated merchant session must confirm the original order and complete Stripe automatic tax.');
  if (automaticTaxPreparationGaps(preparation, quote.components.map(value => value.assetId)).length || hash(JSON.stringify(preparation)) !== quote.preparationHash) fail(503, 'tax_preparation_incomplete', 'The exact original tax review remains required.');
  const actualAddress = normalizeBillingTaxAddress(session.customer_details?.address);
  if (hash(JSON.stringify(actualAddress)) !== quote.addressHash) fail(409, 'tax_billing_address_changed', 'The paid billing address differs from the original approved tax quote. Reconciliation is required.');
  if (lineItems.has_more || lineItems.data.length !== quote.components.length) fail(409, 'tax_receipt_incomplete', 'Retrieve every expanded merchant line item and tax breakdown.');
  const seen = new Set<string>(), lines: AutomaticTaxReceipt['lines'] = [];
  for (const line of lineItems.data) {
    const product = line.price?.product;
    if (!product || typeof product === 'string' || 'deleted' in product && product.deleted) fail(409, 'tax_receipt_incomplete', 'Expand each actual merchant product identity and tax code.');
    const component = quote.components.find(value => value.assetId === product.metadata?.assetId);
    const taxCode = typeof product.tax_code === 'string' ? product.tax_code : product.tax_code?.id;
    if (!component || seen.has(component.assetId) || product.metadata?.skuId !== component.skuId || product.metadata?.editionVersion !== component.editionVersion || product.metadata?.contentSha256 !== component.contentSha256 || taxCode !== component.taxCode || line.quantity !== 1 || line.currency.toUpperCase() !== quote.currency || line.price?.currency.toUpperCase() !== quote.currency || line.price?.unit_amount !== component.amountMinor || line.price?.tax_behavior !== 'inclusive' || line.amount_total !== component.amountMinor || line.amount_discount !== 0 || !Number.isSafeInteger(line.amount_tax) || line.amount_tax < 0 || line.amount_tax > component.amountMinor || !line.taxes?.length) fail(409, 'tax_line_mismatch', 'The actual tax lines must match every exact quoted edition, allocation and inclusive price.');
    seen.add(component.assetId);
    let taxMinor = 0;
    const reasons: string[] = [];
    const taxes: AutomaticTaxReceipt['lines'][number]['taxes'] = [];
    for (const tax of line.taxes) {
      if (!Number.isSafeInteger(tax.amount) || tax.amount < 0 || tax.rate?.inclusive !== true || !/^txr_[a-zA-Z0-9]+$/.test(tax.rate.id) || !Number.isFinite(tax.rate.percentage) || tax.rate.percentage < 0 || tax.rate.country != null && !/^[A-Z]{2}$/.test(tax.rate.country) || tax.rate.state != null && (typeof tax.rate.state !== 'string' || tax.rate.state.length > 80 || /[\u0000-\u001f\u007f]/.test(tax.rate.state)) || tax.taxable_amount != null && (!Number.isSafeInteger(tax.taxable_amount) || tax.taxable_amount < 0) || !tax.taxability_reason || !acceptedTaxReasons.has(tax.taxability_reason)) fail(409, 'tax_treatment_unconfirmed', 'Unknown, unsupported, not-collecting, reverse-charge or customer-exemption treatment needs an independent review. A zero result is not approval.');
      taxMinor += tax.amount; reasons.push(tax.taxability_reason);
      taxes.push({ rateId: tax.rate.id, country: tax.rate.country ?? null, state: tax.rate.state ?? null, percentage: tax.rate.percentage, taxableAmountMinor: tax.taxable_amount ?? null, reason: tax.taxability_reason, amountMinor: tax.amount });
    }
    if (taxMinor !== line.amount_tax) fail(409, 'tax_line_mismatch', 'The complete line tax breakdown must reconcile to the actual tax amount.');
    lines.push({ assetId: component.assetId, amountMinor: component.amountMinor, taxMinor, reasons, taxCode, taxes });
  }
  const taxMinor = lines.reduce((sum, line) => sum + line.taxMinor, 0);
  if (lines.reduce((sum, line) => sum + line.amountMinor, 0) !== quote.totalMinor) fail(409, 'tax_total_mismatch', 'The complete line gross amounts must equal the original order total.');
  if (session.total_details?.amount_tax !== taxMinor || session.total_details.amount_discount !== 0 || session.total_details.amount_shipping !== 0) fail(409, 'tax_total_mismatch', 'Tax, discount and shipping totals must reconcile to this digital-only order.');
  const maximumTax = inclusiveTaxCeilingMinor(quote.components.map(component => component.amountMinor), preparation.pricing.inclusiveTaxRateCeiling!);
  if (taxMinor > maximumTax) fail(409, 'tax_budget_exceeded', 'The actual tax exceeds the reviewed before-payment budget. Reconciliation is required.');
  return { sessionId: session.id, quoteHash, billingAddressHash: quote.addressHash, currency: quote.currency, grossMinor: quote.totalMinor, taxMinor, netMinor: quote.totalMinor - taxMinor, lines };
}
export function actualTaxCostResult(grossMinor: number, taxMinor: number, inputs: CostInputs, preparation: AutomaticTaxPreparation, componentAmounts = [grossMinor]) {
  amount(grossMinor); amount(taxMinor);
  if (taxMinor > grossMinor) fail(400, 'invalid_tax_amount', 'Tax cannot exceed the inclusive collected amount.');
  const budget = automaticTaxBudget(grossMinor, inputs, preparation, componentAmounts), missing = costFields.filter(key => key !== 'vatRate' && inputs[key] == null);
  const fixed = costFields.filter(key => !['vatRate', 'percentFees', 'targetSurplus'].includes(key)).reduce((sum, key) => sum + (inputs[key] ?? 0), 0);
  const netMinor = grossMinor - taxMinor, complete = missing.length === 0;
  // Round each fee independently upwards; combining percentages can underbudget
  // separate payment and tax-service invoice rounding by one minor unit.
  const paymentFee = Math.ceil(grossMinor * (inputs.percentFees ?? 0));
  const taxServiceFee = Math.ceil(grossMinor * preparation.pricing.percentFee!) + preparation.pricing.fixedFeeMinor!;
  const surplusMinor = complete ? netMinor - paymentFee - fixed - taxServiceFee : null;
  return { complete, missing, netMinor, surplusMinor, targetMet: complete ? surplusMinor! >= inputs.targetSurplus! : null, beforePaymentBudget: budget };
}
