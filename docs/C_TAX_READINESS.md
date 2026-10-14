# Backend tax preparation review

The administrator's **Tax preparation** tab and **Download preparation JSON**
read stored preparation and cost completeness. They do not establish that a tax
registration is active, collect tax, complete a filing or approve a sale.
Automatic-tax checkout keeps its existing implementation lock.

`GET /api/admin?view=tax_readiness` and
`GET /api/admin/export?view=tax_readiness` require a current verified administrator
session with KARUU brand access. Customers, anonymous visitors and administrators
limited to JKJ-Plus cannot read these records. Export responses use private,
no-store cache headers. No new permissions or provider calls are introduced.

The report first reads the actual version-3 migration marker. Without it, the
query selects only existing base columns and shows the manual setup and an
unapplied preparation database update. It never applies a migration. A database
error returns an unavailable service, rather than an apparently complete empty
report. At most 200 recent editions are returned; `truncated=true` explicitly
marks a limited report. This is not a historical tax filing export.

Automatic-mode records reuse the preparation validator and its gaps. Recorded
review fields remain separate from actual merchant verification. Swedish
small-seller facts missing from a stored record are listed as unknown; no
destination-tax election, sales total or registration coverage is inferred.
Costs use the existing normalization rules: explicit zero is recorded, null is
unknown, and incomplete source allocations remain unknown. Actual quote
profitability, registration completion and filing completion remain null in this
report. They are not substituted with zero or a negative factual assertion.

Output uses a fixed summary whitelist. Original tax proof content, evidence
references/dates, registration identities, billing addresses, personal data and
server secrets are not included. Invalid records show safe status messages and
validation codes without echoing their original content.

Local verification:
`node --test scripts/test-tax-readiness.mjs scripts/test-global-tax-preparation.mjs`.
Result: 28/28 passed (10 preparation-report tests plus 18 existing tax-flow
regressions). TypeScript, scoped ESLint and diff checks also passed.
The new tests execute actual server helpers, authentication and export routing
against an isolated PGlite private schema with runtime RLS. Network/provider and
mutation boundaries reject unexpected calls. These fixtures are not verification
of the real merchant, taxpayer evidence, a real payment or a deployed Worker.
