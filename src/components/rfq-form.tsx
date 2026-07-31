'use client';

import { useState } from 'react';
import type { Product } from '@/lib/products';

interface RfqFormProps {
  products: Product[];
  initialProductSlug?: string;
}

const inputClassName =
  'mt-1.5 min-h-12 w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone outline-none transition-colors placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/20';

export function RfqForm({ products, initialProductSlug = '' }: RfqFormProps) {
  const [productSlug, setProductSlug] = useState(initialProductSlug);
  const [quantity, setQuantity] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [logoPrinting, setLogoPrinting] = useState('To discuss');
  const [privateLabel, setPrivateLabel] = useState('To discuss');
  const [packaging, setPackaging] = useState('To discuss');
  const selectedProduct = products.find((product) => product.slug === productSlug);

  const summaryItems = [
    ['Product', selectedProduct?.name || 'Not selected'],
    ['SKU', selectedProduct?.sku || '—'],
    ['Quantity', quantity || 'To discuss'],
    ['Color', color || 'To discuss'],
    ['Size', size || 'To discuss'],
    ['Logo Printing', logoPrinting],
    ['Private Label', privateLabel],
    ['Packaging', packaging],
  ];

  return (
    <form action="/api/inquiry-mailto" method="post" className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
      <div className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
        <input type="hidden" name="formType" value="product-quote" />
        <input type="hidden" name="productSku" value={selectedProduct?.sku || ''} />
        <input type="hidden" name="productName" value={selectedProduct?.name || ''} />
        <input type="hidden" name="factoryStyle" value={selectedProduct?.factoryStyleNumber || ''} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-primary md:col-span-2">
            Product <span className="text-accent">*</span>
            <select className={inputClassName} name="product" required value={productSlug} onChange={(event) => { setProductSlug(event.target.value); setColor(''); setSize(''); }}>
              <option value="">Select a product</option>
              {products.map((product) => <option key={product.slug} value={product.slug}>{product.name} — {product.sku}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-primary">
            Quantity
            <input className={inputClassName} name="estimatedQuantity" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label className="text-sm font-medium text-primary">
            Color
            <select className={inputClassName} name="selectedColor" value={color} onChange={(event) => setColor(event.target.value)}>
              <option value="">To discuss</option>
              {selectedProduct?.colors.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-primary">
            Size
            <select className={inputClassName} name="sizeRequirements" value={size} onChange={(event) => setSize(event.target.value)}>
              <option value="">To discuss</option>
              {selectedProduct?.sizes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          {[
            ['Logo Printing', 'customLogo', logoPrinting, setLogoPrinting],
            ['Private Label', 'customLabel', privateLabel, setPrivateLabel],
            ['Packaging', 'customPackaging', packaging, setPackaging],
          ].map(([label, name, value, setter]) => (
            <label key={name as string} className="text-sm font-medium text-primary">
              {label as string}
              <select className={inputClassName} name={name as string} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)}>
                <option>No</option><option>Yes</option><option>To discuss</option>
              </select>
            </label>
          ))}
          <label className="text-sm font-medium text-primary">
            Company Name <span className="text-accent">*</span>
            <input className={inputClassName} name="companyName" required autoComplete="organization" />
          </label>
          <label className="text-sm font-medium text-primary">
            Contact Name <span className="text-accent">*</span>
            <input className={inputClassName} name="contactName" required autoComplete="name" />
          </label>
          <label className="text-sm font-medium text-primary">
            Business Email <span className="text-accent">*</span>
            <input className={inputClassName} type="email" name="businessEmail" required autoComplete="email" />
          </label>
          <label className="text-sm font-medium text-primary">
            Country / Region <span className="text-accent">*</span>
            <input className={inputClassName} name="countryRegion" required autoComplete="country-name" />
          </label>
        </div>
        <label className="block text-sm font-medium text-primary">
          Additional Requirements
          <textarea className={`${inputClassName} min-h-32 resize-y`} name="message" placeholder="Share delivery timing, target market, or other requirements." />
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-stone-600">
          <input type="checkbox" name="privacyConsent" value="Agreed" required className="mt-1 h-4 w-4 rounded border-stone-300 text-secondary focus:ring-secondary" />
          <span>I agree that KARUU may use this information to respond to my business inquiry. <span className="text-accent">*</span></span>
        </label>
        <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-8 py-3.5 font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:w-auto">
          Prepare Quote Request
        </button>
      </div>

      <aside className="rounded-2xl bg-primary p-6 text-white lg:sticky lg:top-28">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Inquiry Summary</p>
        <dl className="mt-5 divide-y divide-white/15">
          {summaryItems.map(([label, value]) => (
            <div key={label} className="py-3 first:pt-0">
              <dt className="text-xs uppercase tracking-wide text-white/60">{label}</dt>
              <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </form>
  );
}
