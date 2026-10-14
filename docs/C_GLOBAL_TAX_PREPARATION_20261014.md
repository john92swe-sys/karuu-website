# KARUU global digital tax preparation — 2026-10-14

The user chose global availability and requested a conservative cost estimate.
That commercial direction does not supply the actual tax-registration schemes,
jurisdiction coverage, processor fees or cost approvals. This change prepares
the integration without enabling international automatic-tax checkout.

## Implemented and independently reviewable

- Existing `manual_verified` products keep their manual inclusive rate flow.
  Old databases/rows with no `tax_mode` column value remain compatible.
- `stripe_automatic` products are always unavailable in the public catalog and
  rejected before a Checkout Session is created. Environment flags, an active
  SKU label and completed review records cannot remove this implementation lock.
  An automatic-mode order cannot grant entitlements through the manual handler;
  genuine refund reconciliation remains possible before the fulfillment guard.
- Private preparation records contain exact component tax-code reviews, each
  reviewed jurisdiction and actual registration identity/scheme, explicit
  Checkout tax-service fee assumptions/evidence, a conservative inclusive-tax
  ceiling and separate sandbox evidence. Missing facts remain missing.
- Helpers normalize the real billing address and include its hash, the exact
  preparation hash and edition/component allocations in the quote identity.
  US, Canadian and Indian addresses require state/province and postal code.
  Two-letter country syntax is not approval or supported-country coverage.
- Read-only evidence validation requires actual active Stripe Tax Settings and
  complete matching registration records, with effective dates and payment mode.
  US state and Canadian provincial registration scope must match. Cross-country
  OSS coverage needs its explicit accounting review; no scheme is inferred from
  the existing Swedish VAT number.
- A pure Checkout parameter builder sets `automatic_tax.enabled`, per-component
  confirmed `product_data.tax_code` and `tax_behavior: inclusive`. It never sends
  manual `tax_rates`, enables adaptive pricing or calls a provider API.
- A separate pure receipt verifier checks the authenticated Session identity,
  complete automatic-tax status, unchanged actual billing address, every expanded
  product/edition/line identity, actual tax breakdown and exact integer totals.
  It keeps actual rate identities, percentage, country/state, taxable amounts and
  reasons. Unknown, unsupported and `not_collecting` results are not accepted as
  verified tax-free sales. B2B reverse-charge and customer-exemption handling are
  outside this preparation and require their own evidence.
- Costs use the actual `grossMinor - taxMinor`, then conservative independent fee
  rounding. Before-payment budgets reserve separate-fee and per-component tax
  rounding; a whole-order VAT approximation cannot hide a bundle rounding deficit.
- `db/003-global-tax-preparation.sql` is an **unapplied** private-schema migration.
  It adds preparation, quote and receipt columns without any seed, grant, role,
  policy, rate, registration or sale activation. Original order tax mode/quote
  and a recorded first receipt cannot be rewritten through ordinary updates.
  The normal baseline, build and startup never execute this file.

## Not connected or released

The preparation helpers are not a live payment implementation. In particular:

1. The current hosted Checkout can change the billing address. An exact-address
   receipt check after capture does not prevent an unapproved purchase. The first
   automatic flow must control jurisdiction eligibility and the approved cost
   budget **before capture**, without substituting a shipping-country restriction
   for digital-service tax location. That flow is not implemented here.
2. Provider evidence retrieval, immutable quote/receipt persistence, registration
   freshness and cost checks must be wired to the chosen payment flow and tested
   in a separate Stripe sandbox before removing the hard lock. Pure fixtures do
   not prove that the actual merchant has Stripe Tax enabled or registered.
3. No standalone Tax Calculation API is called. Its per-call billing is not
   assumed to be covered by Checkout Tax pricing. Switching to that API requires
   a separately reviewed fee scope, permissions and transaction/refund recording.
4. The migration has not been applied to the real database. The admin API rejects
   storing automatic preparation there until version 3 is explicitly applied.
   The current manual editor is not a new automatic-tax onboarding screen.
5. No real registrations, fees, taxes, SKU prices or approvals were configured.
   No new service subscription, key, charge, refund, email or production release
   is part of this change. Existing runtime payment approval flags stay false.

## Accounting facts still needed

Check actual existing records first: Swedish VAT effective dates and applicable
EU cross-border digital B2C reporting/OSS scheme; any country/provincial/state
registrations and their dates; aggregate relevant sales in other channels and
physical presence; the permanent-download product classification; ordinary
card/cross-border/FX/settlement charges; tax-calculation and filing costs; and the
user-confirmed conservative cost allocation/minimum surplus. Keep actual facts
separate from worksheet scenarios. Global intent is not a 0% tax determination.

Candidate codes read from the canonical list: `txcd_10302000` for permanent,
non-subscription downloaded digital books; `txcd_10302001` for limited rights;
`txcd_10301000` for audiobooks. Each actual component still needs review. No
generic electronic-service or nontaxable code is substituted for an unknown fact.

## Primary references

- [Checkout automatic tax](https://docs.stripe.com/tax/checkout/page)
- [Customer location and address requirements](https://docs.stripe.com/tax/customer-locations)
- [Canonical product tax codes](https://docs.stripe.com/tax/tax-codes)
- [Tax behavior and product classification](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior)
- [Registration records and schemes](https://docs.stripe.com/api/tax/registrations)
- [Zero-tax reasons and unsupported territories](https://docs.stripe.com/tax/zero-tax)
- [Current tax-country coverage](https://docs.stripe.com/tax/supported-countries)
- [Stripe high-risk jurisdictions and persons](https://stripe.com/legal/restricted-businesses#high-risk-jurisdictions-and-persons)

Restricted-country screening is not implemented by a syntax-only country parser.
The actual approved market policy must cover Stripe restrictions and subnational
regions before charging. KRU has its separate eligibility rules and stays closed.
