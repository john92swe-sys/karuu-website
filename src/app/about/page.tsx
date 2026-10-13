import type { Metadata } from 'next';
import {
  MapPin,
  Globe,
  Building,
  Award,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About KARUU AB',
  description:
    'Meet KARUU AB, Sweden: physical product sourcing and development, alongside original books, audio, music and games.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <Breadcrumb items={[{ label: 'About KARUU' }]} />

      <div className="mt-8 mb-16 max-w-3xl">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">
          Our Story
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 mb-6 leading-tight">
          Everyday life.
          <br />
          <span className="text-secondary">Original imagination.</span>
        </h1>
        <p className="text-lg text-stone-light leading-relaxed">
          KARUU AB brings physical products and original digital creations together.
          From our Swedish contact point, we coordinate women’s activewear sourcing,
          product development and OEM/ODM projects, and publish stories for curious minds.
        </p>
      </div>

      <section className="c-two-cards mb-16" aria-label="KARUU businesses"><Link href="/physical" className="c-panel c-mint"><h2>Physical products</h2><p>Women’s activewear, yoga and fitness collections for brands and professional buyers. JKJ-Plus drinkware collaboration retains its own brand and project handling.</p><span className="c-text-link">Explore physical products →</span></Link><Link href="/creations" className="c-panel c-lilac"><h2>Digital creations</h2><p>Original fiction, audio editions and music, with new game worlds in development. Explore the available editions and their actual platform or direct purchase options.</p><span className="c-text-link">Explore digital creations →</span></Link></section>

      {/* Company overview */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: 'Sweden', label: 'KARUU AB headquarters' },
            { num: 'Products', label: 'B2B development and collaboration' },
            { num: 'Creations', label: 'Original stories, music and games' },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-xl bg-stone-faint text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{s.num}</div>
              <div className="text-sm text-stone-light">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mb-20">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-primary text-white rounded-2xl p-10">
            <h2 className="text-2xl font-bold mb-4 text-accent">Our Mission</h2>
            <p className="text-white/80 leading-relaxed">
              To help activewear buyers move from product brief to an informed sourcing
              decision through clear specifications, practical coordination, and
              responsive international service.
            </p>
          </div>
          <div className="bg-stone-faint rounded-2xl p-10">
            <h2 className="text-2xl font-bold text-primary mb-4">Our Vision</h2>
            <p className="text-stone-light leading-relaxed">
              To build durable B2B relationships by keeping product requirements,
              approvals, documentation, and commercial next steps clear throughout the
              sourcing process.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            Core Values
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">
            What We Stand For
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Clarity', desc: 'Keep specifications, decisions, and next steps visible.' },
            { title: 'Verification', desc: 'Use available product evidence before making claims.' },
            { title: 'Integrity', desc: 'Honest, transparent partnerships with every client.' },
            { title: 'Service', desc: 'Provide responsive communication for international buyers.' },
          ].map((v, i) => (
            <div key={i} className="p-8 rounded-xl bg-white border border-stone-lighter text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-primary mb-2">{v.title}</h3>
              <p className="text-sm text-stone-light">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Company Info */}
      <section className="mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">
              Company Profile
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
              KARUU AB — Swedish Company
            </h2>
            <div className="space-y-4 mb-8">
              {[
                { icon: Building, label: 'Company Name', value: 'KARUU AB' },
                { icon: Award, label: 'Registration No.', value: '559244-1892 (Bolagsverket)' },
                { icon: MapPin, label: 'Headquarters', value: 'Vattugatan 2A, 302 33 Halmstad, Sweden' },
                { icon: Users, label: 'Business Model', value: 'Physical products and original digital creations' },
                { icon: Globe, label: 'Service', value: 'International buyer communication' },
                { icon: Clock, label: 'Founded', value: 'February 2020' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-stone-lighter last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-stone-lighter">{item.label}</div>
                    <div className="font-semibold text-primary">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square max-w-md mx-auto rounded-2xl bg-stone-faint flex items-center justify-center">
            <div className="text-center p-10">
              <Building className="w-20 h-20 mx-auto text-secondary/50 mb-4" />
              <p className="text-stone-light text-sm">
                Company / office imagery area
                <br />
                (placeholder)
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
