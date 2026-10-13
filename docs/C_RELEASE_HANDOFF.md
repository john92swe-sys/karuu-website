# KARUU C implementation handoff — 13 October 2026

This upgrade continues the existing Git source in `john92swe-sys/karuu-website`
from baseline commit `5994198f63e840cceb0d2226b1f15214ee5a522c`, in branch
`codex/karuu-c-store-20261013`. The original D-drive checkout was clean and is
preserved. The source commit corresponding to the active Cloudflare production
version has not yet been established. The current production site has not been
replaced by this work.

## Verified starting point

- The current Cloudflare dashboard verifies that Worker `karuu-production`
  serves custom domains `www.karuu.net` and `karuu.net`. Its active displayed
  version identifier is `5abbde92`, Ready with 100% traffic. The dashboard lists
  Wrangler as the deployer and displays `25d ago`. Its workers.dev endpoint is
  `https://karuu-production.john92swe.workers.dev`.
- That Worker currently has only an `ASSETS` binding, no environment or database
  bindings, compatibility date `2026-09-17`, and no `nodejs_compat` flag. This
  is not evidence that the new Next.js server routes, PostgreSQL, payment events
  or private delivery already run in Cloudflare.
- The same account also lists Pages projects `karuu-website` (`No Git`, displayed
  `25d ago`) and `karuu-digital-store` (`No Git`, displayed `2d ago`). The digital
  Pages production deployment is verified as
  `eab7a056-9701-44b4-abee-713bfcef96c4`, successful; its dashboard timestamp is
  `Oct 10, 9:27 AM` with no verified UI timezone. Its only current production
  hostname is `karuu-digital-store.pages.dev`. It has six static assets
  (404, favicon, index, release, robots and sitemap), zero environment variables
  and no order database.
- The current digital Pages public catalogue contains 16 records, with its core
  content matching the historical Netlify catalogue. This live content and domain
  check does not establish a Git commit or grant access to external platform
  customer orders.
- The Git remote default branch is `main`. `5994198` is the inspected Git
  baseline, not a verified commit of the active Cloudflare Worker. Previously
  inspected Vercel records do not establish the current production route.
- The existing App Router project, React 18, TypeScript and Tailwind are retained.
  Next.js has been upgraded from the historical 14 baseline to `15.5.27` for
  OpenNext Cloudflare `1.20.10`; Wrangler is `4.148.0`. Page parameters, search
  parameters, route contexts and cookies use the current asynchronous interfaces.
  Existing Radix/shadcn components and Lucide are retained; no new hosted CMS
  service is created.
- The original inquiry endpoint prepares a mail draft. It does not persist or
  deliver enquiries. The new `/api/inquiries` is a separate persistent service;
  the old `/api/inquiry-mailto` remains compatible.
- `discover.karuu.net` currently serves Europe–China Market Access. It is not
  the consumer store. The historical, still-accessible digital catalogue copy
  at `https://karuu-digital-store.netlify.app/` reports version 1.0.1, disabled
  direct payments and local-browser Saved items. This copy supplied migration
  evidence; it is not proof of the current Cloudflare digital deployment.
- The inspected Vercel project returned no environment variables; that finding
  applies to that project only and does not describe Cloudflare production.
  Existing Supabase projects were INACTIVE and have not been repurposed or changed.
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
work are consolidated as formats. The accessible historical Netlify catalogue
and recovered files supplied the initial inventory. The current Cloudflare
digital Pages catalogue has now been read: it contains 16 public records and
the same core content. The 12 applicable work entries are not a claim that all
16 source records are separate sale-ready SKUs. See `C_ASSET_INVENTORY.md` for exact identity,
source checks, licences, platform links and state. No accounts, historic orders or
platform entitlements were migrated: the inspected digital Pages deployment has
no order database, and access to Payhip or other platform customer exports has
not been established.

No change or redirect was made to the Netlify copy, Cloudflare production or
`discover.karuu.net`. Once the actual digital deployment and its source are
confirmed, map its work IDs to the matching
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

These are source implementations and local verification results. Cloudflare
runtime adaptation is implemented using OpenNext dynamic Workers. Adapter
packaging, a Wrangler dry run and the C homepage in local workerd have been
verified. This is not a remote Cloudflare release or a replacement of the active
ASSETS-only production Worker. External providers and production operation are
not inferred from code, packaging or local test results; the new dynamic account,
database, checkout and delivery services have not been enabled in production.

## Validation and its limits

The final deliverable includes actual command output and browser reports for the
same release source. The current Next.js `15.5.27` build generates 102 pages; the
earlier Next.js 14 / 105-page build is historical evidence. Type checking, ESLint,
the mandatory public-product safety check and production build must pass for the
exact final source before release. The original catalogue/MOQ
tests have been updated only where C intentionally replaces draft-email behaviour;
legacy publication exclusions still have checks.

The current Node test report has 28 passing top-level tests: 10 catalogue/MOQ
tests and 18 commerce tests, including the Workers connection lifecycle guard.
The previous 27-test report belongs to the earlier source revision.

Commerce tests execute real SQL constraints and repeatable migration in an
isolated, persistent PostgreSQL WASM engine (PGlite), including a close/reopen.
Payment, mail and private-storage boundaries are explicit fixtures. Stripe's
actual signature validation code is used, but there is no real merchant test
Checkout Session, card payment, email delivery or storage integration claim.

`npm run build:cloudflare` has successfully packaged Next.js `15.5.27` through
OpenNext `1.20.10`. Wrangler `4.148.0` dry-run packaging reports 514 assets and a
worker upload size of 6712.57 KiB, gzip 1305.29 KiB. Local workerd at
`http://127.0.0.1:3097` passed 32 HTTP checks: 20 application pages, preview robots,
and 11 service/permission checks. It rendered the actual C homepage. The exact
final backend guard was rebuilt and checked. Preview metadata and response headers
are noindex/nofollow and robots disallows crawling. These checks prove local Workers
rendering and honest unconfigured-service behaviour, not a remote deployment or
real Hyperdrive, merchant, mail or private-media integration.

The review configuration is `wrangler.jsonc` with independent Worker name
`karuu-c-review-20261013`, the generated `.open-next/worker.js`, ASSETS and a
self-reference binding. It has `nodejs_compat` and
`global_fetch_strictly_public`; it contains no production custom domains/routes
and no `HYPERDRIVE_COMMERCE` binding. Payment enablement and all four live-commerce
approvals are false. The database caching attestation is also false. These
settings preserve an isolated review boundary and closed commerce, rather than
pretending a live database or merchant service exists.

Any Vercel preview generated by the repository's historical Git integration is
an incidental preview artifact. It is not the production host or the Cloudflare
runtime acceptance environment.

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
| Exact production source and final Cloudflare runtime acceptance | OpenNext adaptation, dry-run packaging and local homepage are verified; maintainer preserves the active Worker's source/artifact, rebuilds the final runtime-guard version and checks key APIs before any approved remote review upload | Reproducible release/rollback and acceptance of new server routes in the actual deployment |
| Digital Pages source and record mapping | Production hostname, deployment ID and 16-record public catalogue are verified; maintainer identifies the deployed source/artifact and completes each old-record mapping without fabricating external orders | Reproducible digital migration and old-to-new URL/work mapping |
| Secure PostgreSQL/Hyperdrive connection and operator role | Operator selects the approved provider/plan, supplies the real `HYPERDRIVE_COMMERCE` binding with caching disabled and verified server settings, applies reviewed schema and tests actual requests | Persisted enquiries, accounts, CMS and orders in Workers |
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

1. Preserve the active Cloudflare Worker version `5abbde92`, its routing and
   settings, and obtain its recoverable deployment artifact/source before any
   replacement. Retain Git baseline `5994198` separately; it is not a verified
   rollback artifact for the current Worker. Use this isolated branch for review;
   a draft PR, local build or preview is not a production promotion.
2. Use the implemented Next.js `15.5.27` / React 18 / OpenNext `1.20.10` path and
   independent review Worker configuration. Rebuild the final backend
   runtime-guard source, repeat dry-run packaging and verify key APIs in local
   workerd before any authorized remote preview. The active production Worker
   remains ASSETS-only; do not change its domains, traffic or bindings as part
   of an isolated review upload. Actual Hyperdrive, merchant, media and mail
   integration acceptance remains outstanding.
3. Supply environment-specific values only in the verified server deployment
   settings. Set `KARUU_DEPLOYMENT_ENV=preview` for preview; production must remove
   that override. `VERCEL_ENV=preview` remains a compatible indexing signal in
   the source, not evidence that Vercel serves production. Production canonical
   host is `https://www.karuu.net`.
4. Apply the additive migration to a backed-up, approved database. Run real
   merchant test mode and private-media checks before enabling live flags.
5. Build through `npm run build` so `prebuild` runs public-product safety. Do not
   bypass that release gate. Package with `npm run build:cloudflare`, then check
   `npm run check:cloudflare` and the exact workerd artifact. Verify old product
   links, metadata, authority and honest unavailable-service responses; verify
   real database, payments and media only when their services are configured.
   Local build and workerd evidence do not prove remote deployment or production
   transaction readiness.
6. Promote only the reviewed Cloudflare-compatible artifact with confirmed
   operator authorization and verified domain/traffic routing.
7. On rollback, disable new checkout/inquiry intake if necessary, route the
   website back to the retained exact Cloudflare production artifact/version,
   and keep the upgraded
   database plus signed payment events/outbox. Do not restore an old database
   snapshot over transactions created after release. Keep the webhook/repair
   processor available to reconcile payments accepted before rollback.

## Dependencies, licences and ongoing services

Retained framework/UI dependencies keep their original licences. Next.js
`15.5.27`, OpenNext Cloudflare `1.20.10`, `pg` and `stripe` use MIT. Wrangler
`4.148.0` is a development/deployment tool under MIT OR Apache-2.0; `@types/pg`
and PGlite are development/test dependencies. PGlite is Apache-2.0; its PostgreSQL
engine has the PostgreSQL licence. Lucide uses ISC. Exact resolved versions are recorded in
`package-lock.json` and the deliverable dependency inventory. No paid dependency,
provider subscription, signed agreement or production infrastructure was purchased.

Cloudflare, any retained historical hosting, and future database/storage/email
and payment services may have ongoing
provider fees. Current account bills and production usage are not available and
are not filled with zero. KRU network/account costs and real rewards are unknown
operating inputs, not fabricated prices. The original attachment cost workbook
was read without modification.
