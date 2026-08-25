import type { Product } from '@/lib/products';

interface ProductInquiryFormProps {
  product: Product;
}

const inputClassName =
  'mt-2 min-h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone outline-none transition-colors placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/20';

export function ProductInquiryForm({ product }: ProductInquiryFormProps) {
  return (
    <form action="/api/inquiry-mailto" method="post" className="space-y-7">
      <div className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
          Your selected product
        </p>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-600">Product</dt>
            <dd className="mt-1 font-semibold text-primary">{product.shortName}</dd>
          </div>
          <div>
            <dt className="text-stone-600">KARUU SKU</dt>
            <dd className="mt-1 font-semibold text-primary">{product.sku}</dd>
          </div>
        </dl>
      </div>

      <input type="hidden" name="formType" value="product-quote" />
      <input type="hidden" name="productSku" value={product.sku} />
      <input type="hidden" name="productName" value={product.name} />
      <input type="hidden" name="productSlug" value={product.slug} />

      <fieldset>
        <legend className="text-lg font-semibold text-primary">1. Contact and order overview</legend>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Start with the essentials. Detailed customization fields are optional below.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-primary md:col-span-2">
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

          <label className="text-sm font-semibold text-primary">
            Company Name <span className="text-accent">*</span>
            <input className={inputClassName} name="companyName" required autoComplete="organization" />
          </label>
          <label className="text-sm font-semibold text-primary">
            Contact Name <span className="text-accent">*</span>
            <input className={inputClassName} name="contactName" required autoComplete="name" />
          </label>
          <label className="text-sm font-semibold text-primary">
            Business Email <span className="text-accent">*</span>
            <input
              className={inputClassName}
              type="email"
              name="businessEmail"
              required
              autoComplete="email"
            />
          </label>
          <label className="text-sm font-semibold text-primary">
            Country / Region <span className="text-accent">*</span>
            <input className={inputClassName} name="countryRegion" required autoComplete="country-name" />
          </label>
          <label className="text-sm font-semibold text-primary">
            Estimated Quantity <span className="text-accent">*</span>
            <input
              className={inputClassName}
              name="estimatedQuantity"
              inputMode="numeric"
              required
              placeholder="Your estimated order volume"
            />
          </label>
          <label className="text-sm font-semibold text-primary">
            WhatsApp / Phone
            <input className={inputClassName} name="phone" type="tel" autoComplete="tel" />
          </label>
        </div>

        <label className="mt-5 block text-sm font-semibold text-primary">
          Message <span className="text-accent">*</span>
          <textarea
            className={`${inputClassName} min-h-32 resize-y`}
            name="message"
            required
            placeholder="Share your target market, intended use, branding needs, or questions."
          />
        </label>
      </fieldset>

      <details className="group rounded-2xl border border-stone-200 bg-white p-5 open:shadow-sm">
        <summary className="cursor-pointer list-none text-base font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
          <span className="flex items-center justify-between gap-4">
            2. Add detailed product requirements
            <span className="text-sm font-medium text-secondary group-open:hidden">Optional +</span>
            <span className="hidden text-sm font-medium text-secondary group-open:inline">Hide −</span>
          </span>
        </summary>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Add only the details already known. All commercial terms remain subject to project
          review.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-primary">
            Number of Colors
            <input className={inputClassName} name="numberOfColors" inputMode="numeric" />
          </label>
          <label className="text-sm font-semibold text-primary">
            Size Requirements
            <input className={inputClassName} name="sizeRequirements" placeholder="e.g. S–XL size split" />
          </label>
          <label className="text-sm font-semibold text-primary">
            Custom Logo
            <select className={inputClassName} name="customLogo" defaultValue="To discuss">
              <option>No</option>
              <option>Yes</option>
              <option>To discuss</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-primary md:col-span-2">
            Branding Requirement
            <input className={inputClassName} name="brandingRequirement" placeholder="Logo method, placement, finish, label, or packaging brief" />
          </label>
          <label className="text-sm font-semibold text-primary">
            Custom Label
            <select className={inputClassName} name="customLabel" defaultValue="To discuss">
              <option>No</option>
              <option>Yes</option>
              <option>To discuss</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-primary">
            Custom Packaging
            <select className={inputClassName} name="customPackaging" defaultValue="To discuss">
              <option>No</option>
              <option>Yes</option>
              <option>To discuss</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-primary">
            Preferred Trade Term
            <select className={inputClassName} name="preferredTradeTerm" defaultValue="To discuss">
              <option>To discuss</option>
              <option>EXW</option>
              <option>FOB</option>
              <option>CIF</option>
              <option>DDP</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-primary">
            Target Launch Date
            <input className={inputClassName} name="targetLaunchDate" type="date" />
          </label>
          <label className="text-sm font-semibold text-primary">
            Required Delivery Date
            <input className={inputClassName} name="requiredDeliveryDate" type="date" />
          </label>
        </div>
      </details>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-stone-700">
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
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-8 py-3.5 font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:w-auto"
        >
          Prepare Quote Request
        </button>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          This prepares an email draft addressed to KARUU for your review and sending. No price
          is generated automatically, and no inquiry is recorded until you send the email.
        </p>
      </div>
    </form>
  );
}
