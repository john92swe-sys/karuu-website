# KARUU AB — Creative Life Store

## Current engineering and review deployment

The current application uses Next.js 15.5.27, React 18, Tailwind 4 and OpenNext
1.20.10 for Cloudflare Workers. The production domains are served by the separate
`karuu-production` Worker; its active source-to-Git correspondence has not been
recovered. This checkout and its deploy script target only the isolated
`karuu-c-review-20261013` Worker. See `docs/C_RELEASE_HANDOFF.md` for verified
deployment evidence and the boundary between preview and production.

Run `npm test`, `npm run build:cloudflare` and `npm run check:cloudflare` before a
review upload. With the existing official Wrangler authorization, use
`npm run deploy:cloudflare:review`. That command validates the review name and
closed commercial flags; it does not route production traffic.

The approved C image and its separate desktop/phone crops are kept in
`docs/design-reference/`. `scripts/qa-c-visual.mjs` captures the required five
CSS viewports in actual Edge; `npm run test:visual` compares against the
manually reviewed C implementation in `docs/design-reference/visual-baselines/`.
The existing bundled Playwright can be supplied through `PLAYWRIGHT_MODULE`;
no new global tool or scaffold is required. Baselines use Windows/Edge and
Segoe UI and must not be updated to conceal a failed design review.

Account, database, merchant, email, private-media and KRU services remain gated
until their real configuration and acceptance are complete. Published platform
editions and genuine activewear inquiries remain distinct business paths.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Home page
│   ├── products/
│   │   ├── page.tsx              # Product list / catalog
│   │   └── [slug]/page.tsx       # Product detail template
│   ├── oem-odm/page.tsx          # OEM / ODM service page
│   ├── manufacturing/page.tsx    # Manufacturing process page
│   ├── quality-certifications/page.tsx  # Quality & Certifications
│   ├── sustainability/page.tsx   # Sustainability page
│   ├── about/page.tsx            # About KARUU
│   ├── contact/page.tsx          # Contact page
│   ├── sitemap.ts                # Dynamic sitemap.xml
│   ├── robots.ts                 # robots.txt
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles + Tailwind
├── components/
│   ├── navbar.tsx                # Navigation
│   ├── footer.tsx                # Footer
│   ├── site-layout.tsx           # Layout wrapper
│   ├── breadcrumb.tsx            # Breadcrumb navigation
│   ├── floating-actions.tsx      # WhatsApp + back-to-top
│   ├── contact-form.tsx          # Inquiry form
│   ├── product-gallery.tsx       # Product image carousel
│   └── sections/home-sections.tsx  # Home page sections
├── data/
│   └── products/
│       ├── types.ts              # Reusable product data model
│       ├── index.ts              # Published product registry
│       └── kr01-0001.ts          # KR01-0001 source-of-truth data
└── lib/
    └── products.ts               # Product selectors and category helpers
```

## Product Image Path

Published product images use relative paths. Place images in:
```
public/images/products/{product-slug}/01-main.webp
public/images/products/{product-slug}/02-front.webp
...
```

Example:
```
public/images/products/kr01-0001/01-main-pink.webp
```

Supported formats: WebP (preferred), JPG, PNG.
Images are lazy-loaded by default.

## Product inquiry fallback

The website does not claim that a form has been sent without a configured delivery
service. Product and general inquiry forms post to `/api/inquiry-mailto`, which prepares
an email draft for the buyer to review and send.

Optional server-side environment variable:

```bash
KARUU_INQUIRY_EMAIL=your-public-inquiry-address@example.com
```

If this variable is not set, the route uses the public KARUU inquiry address already
shown on the website. Do not use an API key or private mailbox credential in a
`NEXT_PUBLIC_*` variable.

## Supplier-data safety

- Never add supplier quotation workbooks, source documents, contact details, or source
  archives to `public/` or product data.
- Price, cost, margin, supplier identity, and trade-term amounts must not be stored in
  frontend code, metadata, image alt text, comments, or structured data.
- Product fields without reliable source evidence should remain undefined and must not
  be rendered.
