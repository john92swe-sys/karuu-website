import { InquiryFormShell } from './inquiry-form-shell';

const inputClassName =
  'mt-1.5 min-h-12 w-full rounded-lg border border-stone-lighter bg-white px-4 py-3 text-sm text-stone outline-none transition-colors placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/20';

export default function ContactForm({ brand = 'karuu' }: { brand?: 'karuu' | 'jkj-plus' }) {
  return (
    <InquiryFormShell brand={brand} className="space-y-6 mt-5">
      <input type="hidden" name="formType" value={brand === 'jkj-plus' ? 'drinkware-project-brief' : 'mixed-style-collection-plan'} />
      <input type="hidden" name="inquiryType" value={brand === 'jkj-plus' ? 'Drinkware partnership brief' : 'Mixed-style collection plan'} />

      <fieldset>
        <legend className="text-lg font-semibold text-primary">Start with the essentials</legend>
        <p className="mt-1 text-sm leading-6 text-stone-600">These fields help {brand === 'jkj-plus' ? 'the JKJ-Plus project team' : 'KARUU'} understand your brief and prepare the right next conversation.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-stone">Company Name <span className="text-accent">*</span><input className={inputClassName} type="text" name="companyName" required autoComplete="organization" placeholder="Your company" /></label>
          <label className="text-sm font-medium text-stone">Contact Name <span className="text-accent">*</span><input className={inputClassName} type="text" name="contactName" required autoComplete="name" placeholder="Your full name" /></label>
          <label className="text-sm font-medium text-stone">Business Email <span className="text-accent">*</span><input className={inputClassName} type="email" name="businessEmail" required autoComplete="email" placeholder="you@company.com" /></label>
          <label className="text-sm font-medium text-stone">Country <span className="text-accent">*</span><input className={inputClassName} type="text" name="countryRegion" required autoComplete="country-name" placeholder="Your market" /></label>
          <label className="text-sm font-medium text-stone md:col-span-2">Business Type <span className="text-accent">*</span><select className={inputClassName} name="businessType" defaultValue="" required><option value="" disabled>Select your business type</option>{(brand === 'jkj-plus' ? ['Retailer', 'Distributor', 'Brand', 'Other'] : ['Yoga Studio', 'Pilates Studio', 'Activewear Brand', 'Other']).map(type => <option key={type}>{type}</option>)}</select></label>
        </div>
        <label className="mt-4 block text-sm font-medium text-stone">Message <span className="text-accent">*</span><textarea className={`${inputClassName} min-h-32 resize-y`} name="message" required placeholder="Tell us about your collection idea, target market, or the help you need." /></label>
      </fieldset>

      {brand === 'karuu' && <details className="group rounded-xl border border-stone-200 bg-stone-faint p-5 open:bg-white open:shadow-sm">
        <summary className="cursor-pointer list-none font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"><span className="flex items-center justify-between gap-4">Add optional collection details<span className="text-sm font-medium text-secondary group-open:hidden">Optional +</span><span className="hidden text-sm font-medium text-secondary group-open:inline">Hide −</span></span></summary>
        <p className="mt-2 text-sm leading-6 text-stone-600">Share only what is already known. Product series, color and size splits, pricing, sampling, and timing are confirmed for each project.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-stone">Intended Use<input className={inputClassName} name="intendedUse" placeholder="e.g. studio retail, instructor uniform" /></label>
          <label className="text-sm font-medium text-stone">Estimated Total Quantity<input className={inputClassName} name="estimatedQuantity" inputMode="numeric" placeholder="Your estimated total quantity" /></label>
          <label className="text-sm font-medium text-stone">Preferred Product Categories<input className={inputClassName} name="preferredProductCategories" placeholder="e.g. leggings, tops, sets" /></label>
          <label className="text-sm font-medium text-stone">Selected 2–4 Representative Styles<input className={inputClassName} name="representativeStyles" placeholder="e.g. KR01-0002, KR02-0012" /></label>
          <label className="text-sm font-medium text-stone">Instructor or Staff Wear<select className={inputClassName} name="instructorStaffWear" defaultValue="To discuss"><option>To discuss</option><option>Yes</option><option>No</option></select></label>
          <label className="text-sm font-medium text-stone">Member Retail<select className={inputClassName} name="memberRetail" defaultValue="To discuss"><option>To discuss</option><option>Yes</option><option>No</option></select></label>
          <label className="text-sm font-medium text-stone">Teacher Training<select className={inputClassName} name="teacherTraining" defaultValue="To discuss"><option>To discuss</option><option>Yes</option><option>No</option></select></label>
          <label className="text-sm font-medium text-stone">Private Label<select className={inputClassName} name="privateLabel" defaultValue="To discuss"><option>To discuss</option><option>Yes</option><option>No</option></select></label>
          <label className="text-sm font-medium text-stone">Target Launch Date<input className={inputClassName} name="targetLaunchDate" type="date" /></label>
          <label className="text-sm font-medium text-stone">Branding Requirement<input className={inputClassName} name="brandingRequirement" placeholder="Logo, label, or packaging brief" /></label>
          <label className="text-sm font-medium text-stone md:col-span-2">WhatsApp / Phone<input className={inputClassName} type="tel" name="phone" autoComplete="tel" placeholder="Optional direct contact number" /></label>
        </div>
      </details>}

      <label className="flex items-start gap-3 text-sm leading-relaxed text-stone-600"><input type="checkbox" name="privacyConsent" value="Agreed" required className="mt-1 h-4 w-4 rounded border-stone-300 text-secondary focus:ring-secondary" /><span>I agree that this information may be used to respond to my {brand === 'jkj-plus' ? 'JKJ-Plus project brief, with separate brand handling' : 'KARUU business inquiry'}.<span className="text-accent"> *</span></span></label>

      <div>
        <button type="submit" className="c-btn w-full md:w-auto">Submit {brand === 'jkj-plus' ? 'JKJ-Plus project brief' : 'collection brief'}</button>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">A saved request returns a reference number. Commercial terms are confirmed after project review. Read our <a href="/privacy" className="underline">privacy notice</a>.</p>
      </div>
    </InquiryFormShell>
  );
}
