import type { Product } from '@/lib/products';

interface ProductInquiryFormProps {
  product: Product;
}

const inputClassName =
  'mt-1.5 min-h-12 w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone outline-none transition-colors placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/20';

export function ProductInquiryForm({ product }: ProductInquiryFormProps) {
  return (
    <form action="/api/inquiry-mailto" method="post" className="space-y-6">
      <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Product SKU</dt>
            <dd className="font-semibold text-primary">{product.sku}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Factory Style</dt>
            <dd className="font-semibold text-primary">{product.factoryStyleNumber}</dd>
          </div>
        </dl>
      </div>

      <input type="hidden" name="formType" value="product-quote" />
      <input type="hidden" name="productSku" value={product.sku} />
      <input type="hidden" name="productName" value={product.name} />
      <input type="hidden" name="factoryStyle" value={product.factoryStyleNumber} />

      <label className="block text-sm font-medium text-primary">
        Inquiry Type <span className="text-accent">*</span>
        <select className={inputClassName} name="inquiryType" defaultValue="" required>
          <option value="" disabled>
            Select your inquiry type
          </option>
          <option>Wholesale bulk order</option>
          <option>OEM / ODM development</option>
          <option>Sample request</option>
          <option>General product inquiry</option>
        </select>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
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
          <input
            className={inputClassName}
            type="email"
            name="businessEmail"
            required
            autoComplete="email"
          />
        </label>
        <label className="text-sm font-medium text-primary">
          Country / Region <span className="text-accent">*</span>
          <input className={inputClassName} name="countryRegion" required autoComplete="country-name" />
        </label>
        <label className="text-sm font-medium text-primary">
          WhatsApp / Phone
          <input className={inputClassName} name="phone" type="tel" autoComplete="tel" />
        </label>
        <label className="text-sm font-medium text-primary">
          Estimated Quantity
          <input className={inputClassName} name="estimatedQuantity" inputMode="numeric" />
        </label>
        <label className="text-sm font-medium text-primary">
          Selected Color
          <select className={inputClassName} name="selectedColor" defaultValue="">
            <option value="">To discuss</option>
            {product.colors.map((color) => (
              <option key={color.name} value={color.name}>
                {color.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-primary">
          Number of Colors
          <input className={inputClassName} name="numberOfColors" inputMode="numeric" />
        </label>
        <label className="text-sm font-medium text-primary">
          Size Requirements
          <input className={inputClassName} name="sizeRequirements" placeholder="e.g. S–XL size split" />
        </label>
        <label className="text-sm font-medium text-primary">
          Custom Logo
          <select className={inputClassName} name="customLogo" defaultValue="To discuss">
            <option>No</option>
            <option>Yes</option>
            <option>To discuss</option>
          </select>
        </label>
        <label className="text-sm font-medium text-primary">
          Custom Label
          <select className={inputClassName} name="customLabel" defaultValue="To discuss">
            <option>No</option>
            <option>Yes</option>
            <option>To discuss</option>
          </select>
        </label>
        <label className="text-sm font-medium text-primary">
          Custom Packaging
          <select className={inputClassName} name="customPackaging" defaultValue="To discuss">
            <option>No</option>
            <option>Yes</option>
            <option>To discuss</option>
          </select>
        </label>
        <label className="text-sm font-medium text-primary">
          Preferred Trade Term
          <select className={inputClassName} name="preferredTradeTerm" defaultValue="To discuss">
            <option>To discuss</option>
            <option>EXW</option>
            <option>FOB</option>
            <option>CIF</option>
            <option>DDP</option>
          </select>
        </label>
        <label className="text-sm font-medium text-primary md:col-span-2">
          Required Delivery Date
          <input className={inputClassName} name="requiredDeliveryDate" type="date" />
        </label>
      </div>

      <label className="block text-sm font-medium text-primary">
        Message
        <textarea
          className={`${inputClassName} min-h-32 resize-y`}
          name="message"
          placeholder="Share your target market, branding requirements, or other product questions."
        />
      </label>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-stone-600">
        <input
          type="checkbox"
          name="privacyConsent"
          value="Agreed"
          required
          className="mt-1 h-4 w-4 rounded border-stone-300 text-secondary focus:ring-secondary"
        />
        <span>
          I agree that KARUU may use the information above to respond to this business inquiry.
          <span className="text-accent"> *</span>
        </span>
      </label>

      <div>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-8 py-3.5 font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:w-auto"
        >
          Prepare Quote Request
        </button>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          This prepares an email draft in your email application. Review and send the draft to
          complete your inquiry. No price is generated automatically.
        </p>
      </div>
    </form>
  );
}
