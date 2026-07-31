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
  title: 'Manufacturing | KARUU Production Capabilities',
  description:
    'State-of-the-art manufacturing with 100+ skilled workers, advanced equipment, and strict quality control. OEKO-TEX certified yoga apparel production.',
  alternates: { canonical: '/manufacturing' },
};

const steps = [
  { icon: Scissors, title: 'Cutting', desc: 'Precision automatic cutting machines ensure accuracy and consistency across every piece.' },
  { icon: Shirt, title: 'Sewing', desc: 'Skilled seamstresses with years of experience in activewear construction.' },
  { icon: ShieldCheck, title: 'QC Inspection', desc: 'Multi-stage quality control — in-line, end-line, and final inspection.' },
  { icon: Package, title: 'Packaging', desc: 'Custom packaging options with your branding — polybags, boxes, hang tags.' },
  { icon: Truck, title: 'Shipping', desc: 'Flexible shipping options — air, sea, or express with tracking.' },
];

export default function ManufacturingPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <Breadcrumb items={[{ label: 'Manufacturing' }]} />

      <div className="mt-8 mb-16 max-w-3xl">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">
          Our Factory
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 mb-6 leading-tight">
          Precision Manufacturing
          <br />
          <span className="text-secondary">Meets Craftsmanship</span>
        </h1>
        <p className="text-lg text-stone-light leading-relaxed">
          Our production facility combines advanced technology with skilled craftsmanship
          to deliver premium yoga apparel at scale. Every step is managed in-house for
          full quality control and faster lead times.
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
              Equipment
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
              Advanced Production Technology
            </h2>
            <p className="text-stone-light leading-relaxed mb-6">
              We invest in the latest machinery to ensure precision, consistency, and
              efficiency. Our facility is equipped with automated cutting systems,
              flatlock machines, and fabric testing equipment.
            </p>
            <ul className="space-y-3">
              {[
                'Automatic fabric cutting machines',
                'Flatlock & overlock sewing machines',
                'Heat transfer & sublimation printing',
                'Fabric testing lab (stretch, color fastness, pilling)',
                'Laser cutting for clean edges',
                'Quality inspection at every stage',
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
                Production facility image area
                <br />
                (placeholder — add real factory photos)
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
            Schedule a virtual factory tour or request a sample to see our quality firsthand.
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
