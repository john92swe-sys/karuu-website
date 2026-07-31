# KARUU AB — B2B Activewear Website

## Quick Deploy to Vercel

1. Upload the entire project folder to Vercel
2. Vercel will auto-detect Next.js and build automatically
3. No additional configuration needed

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
