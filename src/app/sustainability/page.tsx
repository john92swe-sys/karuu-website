import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Leaf,
  Recycle,
  Droplets,
  Truck,
  TreeDeciduous,
  HeartHandshake,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata: Metadata = {
  title: 'Sustainability | KARUU Eco-Friendly Yoga Apparel',
  description:
    'Our commitment to sustainable fashion — recycled fabrics, eco-friendly packaging, carbon-neutral shipping, and ethical manufacturing practices.',
  alternates: { canonical: '/sustainability' },
};

const pillars = [
  {
    icon: Recycle,
    title: 'Recycled Materials',
    desc: 'Recycled polyester from plastic bottles — each pair of leggings keeps 7+ bottles out of landfills.',
  },
  {
    icon: Droplets,
    title: 'Water Conservation',
    desc: 'Advanced dyeing technology reduces water usage by 40% compared to traditional methods.',
  },
  {
    icon: Truck,
    title: 'Carbon-Neutral Shipping',
    desc: 'We offset 100% of shipping emissions through verified reforestation projects.',
  },
  {
    icon: TreeDeciduous,
    title: 'Eco Packaging',
    desc: 'All packaging is recyclable or compostable — no single-use plastics.',
  },
  {
    icon: HeartHandshake,
    title: 'Fair Labor',
    desc: 'BSCI certified factory with fair wages, safe conditions, and workers rights protection.',
  },
  {
    icon: Leaf,
    title: 'Biodegradable Options',
    desc: 'Selected products use biodegradable fabrics that break down safely at end of life.',
  },
];

export default function SustainabilityPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <Breadcrumb items={[{ label: 'Sustainability' }]} />

      <div className="mt-8 mb-16 max-w-3xl">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">
          Our Commitment
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 mb-6 leading-tight">
          Yoga Wear That&apos;s
          <br />
          <span className="text-secondary">Good for the Planet</span>
        </h1>
        <p className="text-lg text-stone-light leading-relaxed">
          At KARUU, sustainability isn&apos;t an afterthought — it&apos;s built into
          everything we do. From fabric sourcing to packaging, we continuously improve
          our practices to minimize environmental impact while delivering premium quality.
        </p>
      </div>

      {/* Pillars */}
      <section className="mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="p-8 rounded-xl bg-white border border-stone-lighter hover:border-secondary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-[#e8f5f2] text-secondary flex items-center justify-center mb-5">
                <p.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{p.title}</h3>
              <p className="text-stone-light text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Stats */}
      <section className="mb-20">
        <div className="bg-primary rounded-2xl p-10 md:p-14 text-white text-center overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-10">
              Our Environmental Impact (2024)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { num: '150K+', label: 'Plastic Bottles Recycled' },
                { num: '40%', label: 'Less Water Used' },
                { num: '100%', label: 'Carbon-Neutral Shipping' },
                { num: '0', label: 'Single-Use Plastic' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                    {s.num}
                  </div>
                  <div className="text-sm text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">
              2025 Goals
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
              Our Path Forward
            </h2>
            <p className="text-stone-light leading-relaxed mb-6">
              We&apos;re constantly pushing ourselves to do better. Here&apos;s what
              we&apos;re working toward in 2025 and beyond.
            </p>
            <ul className="space-y-3">
              {[
                '30% of collection made from recycled materials',
                'Zero-waste pattern cutting technology',
                'Solar-powered factory expansion',
                'Take-back program for old garments',
                'Full supply chain transparency platform',
                'B Corp certification',
              ].map((g, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-stone">{g}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="aspect-square max-w-md mx-auto rounded-2xl bg-[#e8f5f2] flex items-center justify-center">
            <div className="text-center p-10">
              <Leaf className="w-20 h-20 mx-auto text-secondary/50 mb-4" />
              <p className="text-stone-light text-sm">
                Sustainability imagery area
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
          Partner in Sustainability
        </h2>
        <p className="text-stone-light max-w-xl mx-auto mb-6">
          Looking for an eco-conscious manufacturing partner? Let&apos;s build something
          good together.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-primary-light transition-all hover:-translate-y-0.5"
        >
          Start the Conversation
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
