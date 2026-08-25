import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Palette,
  Scissors,
  Package,
  Sparkles,
  Factory,
  Clock,
  MessageCircle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata: Metadata = {
  title: 'OEM / ODM Coordination | KARUU Activewear',
  description:
    'Discuss activewear product development, sourcing, sampling, branding, and packaging requirements with KARUU.',
  alternates: { canonical: '/oem-odm' },
};

const services = [
  {
    icon: Palette,
    title: 'Custom Design',
    desc: 'Share reference products, technical files, or a development brief for review.',
  },
  {
    icon: Scissors,
    title: 'Pattern & Sample',
    desc: 'Pattern and sampling requirements are assessed before timing is confirmed.',
  },
  {
    icon: Package,
    title: 'Private Label',
    desc: 'Label, hang tag, and packaging requirements can be included in the product brief.',
  },
  {
    icon: Sparkles,
    title: 'Fabric Customization',
    desc: 'Review available fabrics or discuss custom fabric blends and colors.',
  },
  {
    icon: Factory,
    title: 'Bulk Production',
    desc: 'Production scope and quality checkpoints are confirmed after sample approval.',
  },
  {
    icon: Clock,
    title: 'Delivery Planning',
    desc: 'Required dates and logistics preferences are reviewed before a lead time is committed.',
  },
];

export default function OemOdmPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <Breadcrumb items={[{ label: 'OEM / ODM' }]} />

      {/* Hero */}
      <div className="mt-8 mb-16 max-w-3xl">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">
          OEM / ODM Services
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 mb-6 leading-tight">
          Bring Your Yoga Brand
          <br />
          <span className="text-secondary">To Life</span>
        </h1>
        <p className="text-lg text-stone-light leading-relaxed">
          KARUU coordinates OEM and ODM discussions for activewear buyers. Share your design,
          label, packaging, quantity, and delivery requirements so feasibility and next steps
          can be reviewed without unsupported promises.
        </p>
      </div>

      {/* Service Grid */}
      <section className="mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={i}
              className="p-8 rounded-xl bg-white border border-stone-lighter hover:border-secondary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-5">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{s.title}</h3>
              <p className="text-stone-light text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20 rounded-2xl border border-secondary/20 bg-secondary/5 p-8 md:p-10">
        <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary">Adjacent Product Development</p>
            <h2 className="mt-3 text-2xl font-bold text-primary md:text-3xl">Add hydration to your activewear collection</h2>
            <p className="mt-4 max-w-3xl leading-7 text-stone-700">KARUU can coordinate a combined brief covering activewear and documented hydration products, with product-specific branding, sampling, and commercial terms confirmed during review.</p>
          </div>
          <Link href="/products/hydration-drinkware" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white">Explore Hydration<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* Process */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">
            Our OEM Process
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Inquiry', desc: 'Share your requirements' },
            { step: '02', title: 'Design', desc: 'Mockups & sample plan' },
            { step: '03', title: 'Sample', desc: 'Prototype & approval' },
            { step: '04', title: 'Production', desc: 'Bulk manufacturing' },
            { step: '05', title: 'Delivery', desc: 'QC + global shipping' },
          ].map((p, i) => (
            <div key={i} className="relative p-6 rounded-xl bg-stone-faint text-center">
              <div className="text-3xl font-bold text-accent mb-2">{p.step}</div>
              <h4 className="font-semibold text-primary mb-1">{p.title}</h4>
              <p className="text-xs text-stone-light">{p.desc}</p>
              {i < 4 && (
                <ArrowRight className="hidden lg:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 text-stone-lighter z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* MOQ & Details */}
      <section className="mb-20">
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-primary text-white rounded-2xl p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Why Partner With KARUU
            </h2>
            <p className="text-white/70 mb-6">
              We provide a Swedish B2B contact point for product development, sourcing,
              approval coordination, and international communication.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Product requirements reviewed before quotation',
                'Sample scope and timing confirmed per project',
                'Material documentation reviewed when available',
                'Approval points recorded before production',
                'Order terms confirmed before commitment',
                'International communication through KARUU',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{s}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-accent text-primary px-6 py-3 rounded-lg font-semibold hover:bg-accent-light transition-all"
              >
                Get a Free Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/46708802017"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-stone-faint rounded-2xl p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
              Capability Overview
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Product Scope', value: 'Confirmed against the buyer brief' },
                { label: 'Material', value: 'Reviewed from available options and documents' },
                { label: 'Sizing', value: 'Confirmed for each selected style' },
                { label: 'MOQ', value: 'Confirmed per product, color, and customization scope' },
                { label: 'Sample Time', value: 'Confirmed after requirements review' },
                { label: 'Bulk Lead Time', value: 'Confirmed after sample and order approval' },
                { label: 'Customization', value: 'Reviewed for design, color, logo, label, and packaging' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-stone-lighter last:border-0 last:pb-0">
                  <div className="font-semibold text-primary text-sm w-32 flex-shrink-0">
                    {item.label}
                  </div>
                  <div className="text-stone-light text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
