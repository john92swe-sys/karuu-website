const inputClassName =
  'mt-1.5 min-h-12 w-full rounded-lg border border-stone-lighter bg-white px-4 py-3 text-sm text-stone outline-none transition-colors placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/20';

export default function ContactForm() {
  return (
    <form action="/api/inquiry-mailto" method="post" className="space-y-5">
      <input type="hidden" name="formType" value="general-inquiry" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-stone">
          Contact Name <span className="text-accent">*</span>
          <input
            className={inputClassName}
            type="text"
            name="contactName"
            required
            autoComplete="name"
            placeholder="Your full name"
          />
        </label>
        <label className="text-sm font-medium text-stone">
          Business Email <span className="text-accent">*</span>
          <input
            className={inputClassName}
            type="email"
            name="businessEmail"
            required
            autoComplete="email"
            placeholder="you@company.com"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-stone">
          Company Name
          <input
            className={inputClassName}
            type="text"
            name="companyName"
            autoComplete="organization"
            placeholder="Your company"
          />
        </label>
        <label className="text-sm font-medium text-stone">
          Country / Region
          <input
            className={inputClassName}
            type="text"
            name="countryRegion"
            autoComplete="country-name"
            placeholder="Your market"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-stone">
          WhatsApp / Phone
          <input
            className={inputClassName}
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+46 ..."
          />
        </label>
        <label className="text-sm font-medium text-stone">
          Estimated Quantity
          <input
            className={inputClassName}
            type="text"
            name="estimatedQuantity"
            inputMode="numeric"
            placeholder="Your estimated order volume"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-stone">
        Product or Service Interest
        <input
          className={inputClassName}
          type="text"
          name="productName"
          placeholder="e.g. KR01-0001, sourcing, or product development"
        />
      </label>

      <label className="block text-sm font-medium text-stone">
        Message <span className="text-accent">*</span>
        <textarea
          className={`${inputClassName} min-h-32 resize-y`}
          name="message"
          required
          placeholder="Tell us about your target product, market, requirements, and timing."
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
          I agree that KARUU may use this information to respond to my business inquiry.
          <span className="text-accent"> *</span>
        </span>
      </label>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-8 py-3.5 font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 md:w-auto"
      >
        Prepare Inquiry Email
      </button>
      <p className="text-xs leading-relaxed text-stone-500">
        This opens an email draft for you to review and send. The website does not claim that
        your inquiry has been delivered before you send it.
      </p>
    </form>
  );
}
