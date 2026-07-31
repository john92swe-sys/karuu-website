'use client';

import { useState, type ChangeEvent } from 'react';

interface ProductOption {
  sku: string;
  name: string;
}

interface RfqFormProps {
  products: ProductOption[];
}

type RfqValues = {
  companyName: string;
  contactPerson: string;
  email: string;
  country: string;
  website: string;
  product: string;
  quantity: string;
  color: string;
  size: string;
  logoPrinting: string;
  privateLabel: string;
  packaging: string;
  destinationCountry: string;
  incoterm: string;
  deliveryDate: string;
  message: string;
};

const initialValues: RfqValues = {
  companyName: '', contactPerson: '', email: '', country: '', website: '', product: '',
  quantity: '', color: '', size: '', logoPrinting: 'No', privateLabel: 'No', packaging: '',
  destinationCountry: '', incoterm: '', deliveryDate: '', message: '',
};

const inputClass = 'mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-stone outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20';
const labelClass = 'block text-sm font-semibold text-primary';

export default function RfqForm({ products }: RfqFormProps) {
  const [values, setValues] = useState<RfqValues>(initialValues);

  const updateValue = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const selectedProduct = products.find((product) => product.sku === values.product);
  const summary = [
    ['Company', values.companyName],
    ['Contact', values.contactPerson],
    ['Email', values.email],
    ['Product', selectedProduct ? `${selectedProduct.sku} — ${selectedProduct.name}` : ''],
    ['Quantity', values.quantity ? `${values.quantity} pcs` : ''],
    ['Color', values.color],
    ['Size', values.size],
    ['Logo', values.logoPrinting],
    ['Private Label', values.privateLabel],
    ['Packaging', values.packaging],
    ['Destination', values.destinationCountry],
    ['Incoterm', values.incoterm],
    ['Expected Delivery', values.deliveryDate],
    ['Message', values.message],
  ];

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
        <FormSection number="01" title="Company Information">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Company Name" name="companyName" value={values.companyName} onChange={updateValue} required autoComplete="organization" />
            <TextField label="Contact Person" name="contactPerson" value={values.contactPerson} onChange={updateValue} required autoComplete="name" />
            <TextField label="Email" name="email" type="email" value={values.email} onChange={updateValue} required autoComplete="email" />
            <TextField label="Country" name="country" value={values.country} onChange={updateValue} required autoComplete="country-name" />
            <TextField label="Company Website" name="website" type="url" value={values.website} onChange={updateValue} placeholder="https://example.com" autoComplete="url" />
          </div>
        </FormSection>

        <FormSection number="02" title="Product Requirements">
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelClass}>Product
              <select className={inputClass} name="product" value={values.product} onChange={updateValue}>
                <option value="">Select a product</option>
                {products.map((product) => <option key={product.sku} value={product.sku}>{product.sku} — {product.name}</option>)}
              </select>
            </label>
            <TextField label="Quantity" name="quantity" type="number" min="1" inputMode="numeric" value={values.quantity} onChange={updateValue} placeholder="e.g. 300" />
            <TextField label="Color" name="color" value={values.color} onChange={updateValue} placeholder="e.g. Black" />
            <TextField label="Size" name="size" value={values.size} onChange={updateValue} placeholder="e.g. S–XL" />
            <ChoiceField legend="Logo Printing" name="logoPrinting" value={values.logoPrinting} onChange={updateValue} />
            <ChoiceField legend="Private Label" name="privateLabel" value={values.privateLabel} onChange={updateValue} />
            <label className={`${labelClass} md:col-span-2`}>Packaging Requirements
              <textarea className={`${inputClass} min-h-24 resize-y`} name="packaging" value={values.packaging} onChange={updateValue} placeholder="Describe bags, boxes, labels, or carton requirements." />
            </label>
          </div>
        </FormSection>

        <FormSection number="03" title="Trade Information">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Destination Country" name="destinationCountry" value={values.destinationCountry} onChange={updateValue} autoComplete="country-name" />
            <label className={labelClass}>Preferred Incoterm
              <select className={inputClass} name="incoterm" value={values.incoterm} onChange={updateValue}>
                <option value="">Select an Incoterm</option>
                {['EXW', 'FOB', 'CIF', 'DDP'].map((term) => <option key={term}>{term}</option>)}
              </select>
            </label>
            <TextField label="Expected Delivery Date" name="deliveryDate" type="date" value={values.deliveryDate} onChange={updateValue} />
          </div>
        </FormSection>

        <FormSection number="04" title="Additional Message">
          <label className={labelClass}>Message
            <textarea className={`${inputClass} min-h-40 resize-y`} name="message" value={values.message} onChange={updateValue} placeholder="Tell us about samples, materials, specifications, or other project requirements." />
          </label>
        </FormSection>
      </form>

      <aside className="rounded-2xl bg-primary p-6 text-white shadow-lg lg:sticky lg:top-28" aria-live="polite">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Live preview</span>
        <h2 className="mt-2 text-2xl font-bold text-white">Inquiry Summary</h2>
        <p className="mt-2 text-sm text-white/65">Your inquiry details update automatically as you complete the form.</p>
        <dl className="mt-6 divide-y divide-white/10">
          {summary.map(([label, value]) => (
            <div className="grid grid-cols-[110px_1fr] gap-3 py-3" key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-white/55">{label}</dt>
              <dd className="break-words text-sm text-white">{value || <span className="text-white/35">Not provided</span>}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 rounded-lg bg-white/10 p-3 text-xs leading-relaxed text-white/70">Preview only — no information is submitted or stored.</p>
      </aside>
    </div>
  );
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-white p-5 shadow-sm md:p-8"><div className="mb-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-50 text-xs font-bold text-secondary">{number}</span><h2 className="text-xl font-bold md:text-2xl">{title}</h2></div>{children}</section>;
}

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: keyof RfqValues; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void };
function TextField({ label, required, ...props }: TextFieldProps) {
  return <label className={labelClass}>{label}{required && <span className="text-accent"> *</span>}<input className={inputClass} required={required} {...props} /></label>;
}

function ChoiceField({ legend, name, value, onChange }: { legend: string; name: 'logoPrinting' | 'privateLabel'; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <fieldset><legend className={labelClass}>{legend}</legend><div className="mt-2 flex gap-3">{['Yes', 'No'].map((option) => <label key={option} className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${value === option ? 'border-secondary bg-secondary-50 text-primary' : 'border-border bg-white text-stone-light hover:border-secondary/60'}`}><input className="sr-only" type="radio" name={name} value={option} checked={value === option} onChange={onChange} />{option}</label>)}</div></fieldset>;
}
