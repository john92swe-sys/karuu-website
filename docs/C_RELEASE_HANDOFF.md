# KARUU C implementation handoff — 13 October 2026

This upgrade continues `john92swe-sys/karuu-website` from production commit
`5994198f63e840cceb0d2226b1f15214ee5a522c`, in branch
`codex/karuu-c-store-20261013`. The original D-drive checkout was clean and is
preserved. The current production site has not been replaced by this work.

## Verified starting point

- `www.karuu.net` and `karuu.net` are verified domains of Vercel project
  `prj_fD2rLCkFAiu3H4PAXduPGWgDmpsV`, `karuu-website`.
- Production deployment `dpl_5KsDMMegdTPV3RDNkB4z5KAqBZDD` is READY and points
  to the exact base commit above. The remote default branch is `main`.
- Next.js App Router, React, TypeScript and Tailwind are retained. Existing
  Radix/shadcn components and Lucide are retained; no new CMS service is created.
- The original inquiry endpoint prepares a mail draft. It does not persist or
  deliver enquiries. The new `/api/inquiries` is a separate persistent service;
  the old `/api/inquiry-mailto` remains compatible.
- `discover.karuu.net` currently serves Europe–China Market Access. It is not
  the consumer store. The real digital catalogue is
  `https://karuu-digital-store.netlify.app/`, version 1.0.1. Direct payments are
  disabled there; Saved items are local browser bookmarks.
- The website Vercel project returned no environment variables. Existing
  Supabase projects are INACTIVE and have not been repurposed or changed.
- Two restored EPUB originals and their covers were found. Direct-sale rights,
  edition alignment and KDP Select status remain to be confirmed.

## Pages and URL preservation

| Purpose | Current routes |
| --- | --- |
| C homepage | `/` |
| Physical business and JKJ-Plus brief | `/physical`, `/physical/jkj-plus` |
| Original catalogue and details | `/products`, `/products/[slug]` retained |
| Original B2B service content | `/oem-odm`, `/manufacturing`, `/quality-certifications`, `/sustainability` retained |
| Company and persistent brief | `/about`, `/contact` retained |
| Consolidated catalogue and actual work details | `/creations`, `/creations/[slug]` |
| Search across the two businesses | `/search?q=...` |
| Bag, verified account, orders and licensed access | `/bag`, `/account` |
| Membership information | `/member-benefits` |
| Operator administration | `/admin` |
| Operating notices in review | `/privacy`, `/terms` |

Old apparel URLs are not redirected to the homepage. Legacy drinkware SKU
publication exclusions remain in force. The new JKJ-Plus collaboration does not
expose that legacy catalogue or claim JKJ-Plus is a subsidiary.

Twelve applicable digital work records have been consolidated, including the two
featured novels, Witness, the Chinese serial and editions, actual music releases,
and three separately identified game projects. Old ebook/audio records of the same
work are consolidated as formats. See `C_ASSET_INVENTORY.md` for exact identity,
source checks, licences, platform links and state. No accounts, historic orders or
platform entitlements were migrated: the public store has no proven such dataset,
and access to Payhip/customer exports has not been established.

No change or redirect was made to the Netlify store or `discover.karuu.net`.
Once the actual store owner confirms migration, map its work IDs to the matching
`/creations/[slug]` page; do not redirect the market-access site wholesale.

## What is implemented

- C colours, typography, rounded panels, both businesses, real source images,
  search, responsive navigation, keyboard focus and reduced-motion support.
- PostgreSQL persistence with reviewable additive schema, server account
  verification and password reset, brand-aware enquiries and unique references.
- Fiat Checkout Sessions, exact order/component snapshots, tax component
  allocations, signed server payment events, idempotent fulfilment and refunds.
- Owned-content library, private five-minute access grants, authenticated media
  proxy, audio byte ranges and client playback/resume. EPUBs download to a reading
  device; an in-browser EPUB reader is not implemented.
- Verified publication catalogue in the same database, operator content editing,
  exact platform links and their source dates, asset versions and file digests,
  normal/promotion prices and time windows, bundle/upgrade prices, costs,
  orders, enquiries, reissue and refund operations with audit records.
- Unknown cost inputs remain unknown. Signed reward headroom, management surplus,
  minimum price, positive allocation order counts and current order price snapshots
  are separate from accounting profit. No sample prices were enabled.
- KRU entry points deny unverified eligibility and China service channels;
  ordinary enquiries and fiat content use do not depend on a KRU capability.

These are source implementations. External providers and production operation are
not inferred from successful code or local test results.

## Validation and its limits

The final deliverable includes actual command output and browser reports for the
same release source. Type checking, ESLint, the mandatory public-product safety
check and production build must pass before release. The original catalogue/MOQ
tests have been updated only where C intentionally replaces draft-email behaviour;
legacy publication exclusions still have checks.

Commerce tests execute real SQL constraints and repeatable migration in an
isolated, persistent PostgreSQL WASM engine (PGlite), including a close/reopen.
Payment, mail and private-storage boundaries are explicit fixtures. Stripe's
actual signature validation code is used, but there is no real merchant test
Checkout Session, card payment, email delivery or storage integration claim.

Browser testing uses installed Microsoft Edge headless with simulated viewports
320, 360, 390, 768, 1280 and 1440 pixels. It covers page rendering, navigation,
search/filter/empty states and honest unconfigured-service feedback. These are
not tests on a physical phone and not production user performance measurements.

## Before external operation

Follow `C_BACKEND_OPERATIONS.md` for variable names, schema application, private
services and administrator setup. No credential values belong in source, browser
variables, screenshots or reports. Four server approvals separately gate live
commerce, taxes, distribution rights and legal terms.

| Dependency | Owner and concrete action | Affected operation |
| --- | --- | --- |
| Secure PostgreSQL connection and operator role | Operator selects the existing approved provider/plan, supplies server connection, applies reviewed schema | Persisted enquiries, accounts, CMS and orders |
| Separate JKJ-Plus owner and mail delivery | Brand owner confirms receiver and service credentials separately | JKJ-Plus brief intake and notification |
| Email delivery and sender identity | Operator supplies verified delivery service for verification/reset and inquiry outbox | New accounts, recovery and notifications |
| Actual Stripe merchant test/live settings | Merchant owner configures secrets, webhook, eligible markets and tax rates; runs provider test payment | Real fiat checkout and refund |
| Final EPUB/audio/music rights and files | Publishing owner confirms actual edition, KDP Select/rights and private objects; verifies SHA and access | Direct SKU activation and actual downloads/playback |
| Prices and full costs | Operator fills actual costs, allocation volumes and approved prices; no 49 SEK assumption | Sale availability and budget feasibility |
| Final operating notices | Operator confirms provider/location/retention, market licences and withdrawal/refund process | Legal approval and live payment gate |
| Existing game production account/ledger API | Original game owner supplies signed fulfilment, query/refund contract, eligibility and release permissions | Game recharge and live point fulfilment |
| KRU activity and signer governance | Token owner verifies business/market authority, spendable funds, real budgets, quotes and controlled signer | Real issuance/payment/redemption |
| Main-site production release | Operator reviews the exact draft/preview and authorizes this release | Production domain replacement |

The actual KRU mint is verified in the asset inventory; it is not missing. The
500 million total supply is not a spendable reward balance. No mint, signing,
token transfer, paid subscription tier or prepaid cash exchange was created.
Real game fulfilment, KRU quoting/issuance/budget execution and point refund
contracts remain disabled and must not be represented as provider integrations.

## Deployment and rollback

1. Retain production `5994198` and its original Vercel deployment. Use this
   isolated branch for review; a draft PR/preview is not a production promotion.
2. Supply environment-specific values only in server settings. Preview builds use
   `VERCEL_ENV=preview` or `KARUU_DEPLOYMENT_ENV=preview`; production must remove the
   preview override. Production canonical host is `https://www.karuu.net`.
3. Apply the additive migration to a backed-up, approved database. Run real
   merchant test mode and private-media checks before enabling live flags.
4. Build through `npm run build` so `prebuild` runs public-product safety. Do not
   bypass that release gate. Verify old product links, metadata, schema, authority,
   payments and media in the actual deployment.
5. Promote only the reviewed source with confirmed operator authorization.
6. On rollback, disable new checkout/inquiry intake if necessary, route the
   website back to the retained production deployment, and keep the upgraded
   database plus signed payment events/outbox. Do not restore an old database
   snapshot over transactions created after release. Keep the webhook/repair
   processor available to reconcile payments accepted before rollback.

## Dependencies, licences and ongoing services

Retained framework/UI dependencies keep their original licences. Newly added
runtime libraries are `pg` (MIT) and `stripe` (MIT); `@types/pg` and PGlite are
development/test dependencies. PGlite is Apache-2.0; its PostgreSQL engine has the
PostgreSQL licence. Lucide uses ISC. Exact resolved versions are recorded in
`package-lock.json` and the deliverable dependency inventory. No paid dependency,
provider subscription, signed agreement or production infrastructure was purchased.

Vercel, future database/storage/email and payment services may have ongoing
provider fees. Current account bills and production usage are not available and
are not filled with zero. KRU network/account costs and real rewards are unknown
operating inputs, not fabricated prices. The original attachment cost workbook
was read without modification.
