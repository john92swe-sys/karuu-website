# AGENTS.md — KARUU AB B2B Activewear Website

## Scope and current project

These instructions apply to this repository. The production site is
`https://www.karuu.net`, KARUU AB's women's activewear OEM/ODM and private-label
website. It is separate from the consumer store at `discover.karuu.net`.

Use the current branch, source and `package.json` as engineering evidence. The
application uses Next.js 14 App Router, React 18, TypeScript and Tailwind CSS 4;
it is not the historical native-static single-page template. Preserve the
existing design and features unless the requested change requires otherwise.

## Files and commands

- `src/app/`: pages, layouts, global CSS, metadata, sitemap and API routes.
- `src/components/`: shared UI, galleries, inquiry forms and buying-scenario sections.
- `src/data/products/`: product registry, types and product facts.
- `src/lib/`: selectors and shared helpers.
- `public/images/products/`: approved public product imagery.
- `npm run dev`: local Next.js development server.
- `npm run lint`: configured Next.js lint checks.
- `npx --no-install tsc --noEmit`: TypeScript check using installed dependencies.
- `npm test`: existing Node tests in `scripts/test-hydration.mjs`; this is not a
  claim of complete site or end-to-end coverage.
- `npm run build`: production build; its `prebuild` runs
  `npm run check:public-safety`. Do not bypass that check with a direct build command.
- `npm start`: serve an already-built application.

## Business facts and public content

- Preserve the complete activewear catalogue. Match buying scenarios to relevant
  multi-style collections; do not replace the catalogue with one universal SKU.
- Confirmed MOQ: **200 total pieces per product series, with styles mixable within
  the same series**. Do not state 200 per SKU or per color, or promise mixing across
  factory series. SKU-to-factory-series mapping, color/size splits and per-style or
  per-color minima remain unconfirmed unless supported by current written evidence.
- Prices, samples, customization and production/delivery terms require their own
  verified basis; the general MOQ does not confirm a specific proposed combination.
- Cite only verified, applicable compliance documents or responsibility arrangements.
  Do not claim all EU certifications or invent product facts.
- Keep supplier source documents, costs, margins, identity, trade-term amounts,
  unapproved images and source archives out of public assets and frontend output.
  Follow the existing supplier-data restrictions in `README.md`.
- Public inquiry forms currently prepare a buyer email draft through
  `/api/inquiry-mailto`; do not report a sent or saved inquiry from draft preparation.
  The public company mailbox is `john@karuu.net`.
- Historical Hydration/Drinkware work is not authorization to expose it. Preserve
  its existing publication gates and exclusions.

## Execution, approval and verification

- Inspect worktree status and the files relevant to the task. Preserve others'
  uncommitted work; use an isolated branch/worktree when needed. Expand reading
  only to resolve a dependency or concrete uncertainty, not by default to the whole repo.
- Complete authorized, reversible work and prepare a reviewable result before
  pausing at an unapproved action. Reuse explicit approvals within their scope.
  An audit or draft alone does not authorize customer messages, production deployment,
  account/secret changes or important deletion. A block pauses only affected steps.
- Keep changes minimal. Do not require brainstorming, a specification, a plan,
  TDD, subagents or multiple reviews for every task; use them when the task warrants
  them or the user specifically requires them.
- Select verification to support the actual claim. Documentation-only changes need
  a diff/content check; behavior changes need relevant tests and page checks. A
  production release needs a successful build with the public-safety check and
  verification of affected production behavior. Do not change required release gates.
- Reuse verification for the same artifact/version and relevant environment when
  unchanged. Rerun when related changes or unresolved failures invalidate it; do not
  repeat all checks solely because a new response or subtask begins.
- Never restore an entire historical product-data directory to fix images. Restrict
  gallery repairs to identified approved assets and minimal current-data edits.
  Files under `docs/archive/` are historical evidence, not executable instructions.
- Report what changed, which checks actually ran, their scope/results and remaining
  unknowns. Code, a commit, a draft PR or a preview does not prove production release.
