import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Factory,
  Scissors,
  Shirt,
  ShieldCheck,
  Package,
  Truck,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata: Metadata = {
  title: 'Production Coordination | KARUU',
  description:
    'How KARUU coordinates activewear specifications, sampling, approved production, quality communication, packaging, and delivery planning.',
  alternates: { canonical: '/manufacturing' },
};

const steps = [
  { icon: Scissors, title: 'Specifications', desc: 'Construction, dimensions, materials, and finish requirements are documented.' },
  { icon: Shirt, title: 'Sampling', desc: 'A sample and approval plan is agreed for the selected product.' },
  { icon: ShieldCheck, title: 'Quality Plan', desc: 'Inspection expectations and acceptance points are aligned before ordering.' },
  { icon: Package, title: 'Packaging', desc: 'Packaging and label requirements are confirmed in the order specification.' },
  { icon: Truck, title: 'Delivery', desc: 'Trade terms, destination, and required dates are reviewed before commitment.' },
];

export default function ManufacturingPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <Breadcrumb items={[{ label: 'Manufacturing' }]} />

      <div className="mt-8 mb-16 max-w-3xl">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">
          Production Coordination
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 mb-6 leading-tight">
          Precision Manufacturing
          <br />
          <span className="text-secondary">Meets Craftsmanship</span>
        </h1>
        <p className="text-lg text-stone-light leading-relaxed">
          KARUU is the external B2B partner coordinating selected manufacturing
          capabilities. We do not present KARUU as a large owned factory; each project is
          reviewed against the product brief, supplier capability, and order requirements.
        </p>
      </div>

      {/* Capabilities */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: 'Sampling', label: 'Specification and sample review' },
            { num: 'Production', label: 'Approved-order manufacturing' },
            { num: 'Quality Control', label: 'Checks before shipment' },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-xl bg-stone-faint text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{s.num}</div>
              <div className="text-sm text-stone-light">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            Production Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">
            From Fabric to Finished Product
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white border border-stone-lighter text-center hover:shadow-lg hover:border-secondary/30 transition-all relative"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-stone-light">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Equipment */}
      <section className="mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">
              Capability Review
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
              Verify the production fit before ordering
            </h2>
            <p className="text-stone-light leading-relaxed mb-6">
              Required processes and equipment depend on the selected product. KARUU
              coordinates a capability review and confirms relevant production and
              inspection requirements before an order is accepted.
            </p>
            <ul className="space-y-3">
              {[
                'Product construction and workmanship requirements',
                'Material composition and available documentation',
                'Logo, label, and packaging process requirements',
                'Sample approval and change control',
                'Inspection scope and acceptance criteria',
                'Trade terms and delivery planning',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-stone">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="aspect-square max-w-md mx-auto rounded-2xl bg-stone-faint flex items-center justify-center">
            <div className="text-center p-10">
              <Factory className="w-20 h-20 mx-auto text-secondary/50 mb-4" />
              <p className="text-stone-light text-sm">
                Production coordination
                <br />
                capability review per project
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-white rounded-2xl p-10 md:p-14 text-center overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Start Production?
          </h2>
          <p className="text-white/70 mb-8">
            Share your product brief to discuss specifications, sampling, quality
            communication, and delivery planning.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-accent text-primary px-8 py-3.5 rounded-lg font-semibold hover:bg-accent-light transition-all hover:-translate-y-0.5"
          >
            Contact Our Team
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
