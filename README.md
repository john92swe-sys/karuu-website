# KARUU AB — Premium Yoga Apparel Website

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
└── lib/
    └── products.ts               # Product data + categories
```

## Product Image Path

All product images use relative paths. Place images in:
```
public/images/products/{product-slug}/1.webp
public/images/products/{product-slug}/2.webp
...
```

Example for KR01001:
```
public/images/products/kr01001-high-waist-leggings/1.webp
```

Supported formats: WebP (preferred), JPG, PNG.
Images are lazy-loaded by default.
