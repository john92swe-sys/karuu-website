import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  ShieldCheck,
  Leaf,
  ClipboardCheck,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata: Metadata = {
  title: 'Quality & Certifications | KARUU Yoga Apparel',
  description:
    'OEKO-TEX Standard 100, ISO 9001, BSCI, REACH compliant. Rigorous quality control ensures premium yoga apparel that meets global standards.',
  alternates: { canonical: '/quality-certifications' },
};

const certs = [
  {
    icon: Award,
    title: 'OEKO-TEX Standard 100',
    desc: 'Every fabric tested for 100+ harmful substances — safe for skin and environment.',
  },
  {
    icon: ShieldCheck,
    title: 'ISO 9001:2015',
    desc: 'Quality management system certified for consistent product quality and process control.',
  },
  {
    icon: ShieldCheck,
    title: 'BSCI Certified',
    desc: 'Business Social Compliance Initiative — ethical manufacturing and fair labor practices.',
  },
  {
    icon: Leaf,
    title: 'REACH Compliant',
    desc: 'Full EU REACH regulation compliance for all chemical substances used in production.',
  },
  {
    icon: ClipboardCheck,
    title: 'SGS Audited',
    desc: 'Regular SGS third-party factory audits for quality and social compliance verification.',
  },
  {
    icon: Award,
    title: 'GRS Certified',
    desc: 'Global Recycled Standard — certified recycled polyester fabrics available.',
  },
];

export default function QualityPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <Breadcrumb items={[{ label: 'Quality & Certifications' }]} />

      <div className="mt-8 mb-16 max-w-3xl">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">
          Quality Assurance
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 mb-6 leading-tight">
          Quality That You
          <br />
          <span className="text-secondary">Can Trust</span>
        </h1>
        <p className="text-lg text-stone-light leading-relaxed">
          At KARUU, quality is non-negotiable. From fabric selection to final inspection,
          every product goes through rigorous quality control processes and holds
          internationally recognized certifications.
        </p>
      </div>

      {/* Certifications Grid */}
      <section className="mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map((c, i) => (
            <div
              key={i}
              className="p-8 rounded-xl bg-white border border-stone-lighter hover:border-secondary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-5">
                <c.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{c.title}</h3>
              <p className="text-stone-light text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QC Process */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            Quality Control
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">
            Multi-Stage Quality Inspection
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Incoming Material',
              items: ['Fabric composition test', 'Color fastness check', 'Weight & stretch verification'],
            },
            {
              step: '02',
              title: 'In-Line Production',
              items: ['Sewing quality inspection', 'Seam strength test', 'Size measurement check'],
            },
            {
              step: '03',
              title: 'End-Line QC',
              items: ['Full garment inspection', 'Defect classification', 'Repair & rework'],
            },
            {
              step: '04',
              title: 'Final AQL Test',
              items: ['AQL 2.5 random sampling', 'Packaging verification', 'Full report before shipping'],
            },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-xl bg-stone-faint">
              <div className="text-2xl font-bold text-accent mb-2">{s.step}</div>
              <h4 className="font-semibold text-primary mb-3">{s.title}</h4>
              <ul className="space-y-2">
                {s.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-stone-light">
                    <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Fabric Testing */}
      <section className="mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">
              Testing Standards
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
              Comprehensive Fabric Testing
            </h2>
            <p className="text-stone-light leading-relaxed mb-6">
              Every fabric batch undergoes thorough testing to ensure performance,
              durability, and safety. Our in-house lab and third-party partners verify
              all key properties.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Color fastness (wash / light / sweat)',
                'Tensile strength & tear resistance',
                'Pilling resistance test',
                'Stretch & recovery test',
                'Shrinkage after washing',
                'pH value testing',
                'AZO dye screening',
                'Heavy metal analysis',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-1" />
                  <span className="text-sm text-stone">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square max-w-md mx-auto rounded-2xl bg-gradient-to-br from-secondary/10 to-accent/10 flex items-center justify-center">
            <div className="text-center p-10">
              <ShieldCheck className="w-20 h-20 mx-auto text-secondary/50 mb-4" />
              <p className="text-stone-light text-sm">
                Testing lab image area
                <br />
                (placeholder)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-faint rounded-2xl p-10 md:p-14 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
          Need Detailed Quality Reports?
        </h2>
        <p className="text-stone-light max-w-xl mx-auto mb-6">
          Contact our team to receive full test reports and certification documents
          for any of our products.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-primary-light transition-all hover:-translate-y-0.5"
        >
          Request Quality Documents
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
