import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileCheck2, Leaf, Package, Route, SearchCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata: Metadata = {
  title: 'Responsible Sourcing Review',
  description:
    'How KARUU handles responsible sourcing questions through product-specific evidence, supplier review, packaging requirements, and logistics discussions.',
  alternates: { canonical: '/sustainability' },
};

const topics = [
  {
    icon: SearchCheck,
    title: 'Supplier Requirements',
    description: 'Buyer requirements are shared and reviewed against the selected manufacturing capability.',
  },
  {
    icon: FileCheck2,
    title: 'Material Evidence',
    description: 'Composition, recycled-content, or other material claims require supporting product documentation.',
  },
  {
    icon: Package,
    title: 'Packaging Brief',
    description: 'Packaging format and material preferences can be included in the quotation request.',
  },
  {
    icon: Route,
    title: 'Logistics Discussion',
    description: 'Destination, trade term, shipment method, and timing are reviewed for each project.',
  },
];

export default function SustainabilityPage() {
  return (
    <main className="container mx-auto px-6 pb-20 pt-28">
      <Breadcrumb items={[{ label: 'Responsible Sourcing' }]} />

      <section className="mb-16 mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Responsible Sourcing
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-primary md:text-5xl">
          Ask the right questions and verify the evidence
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-light">
          Sustainability requirements vary by product, material, supplier, packaging, and
          market. KARUU does not publish broad environmental claims without supporting
          evidence; requirements are reviewed at product and order level.
        </p>
      </section>

      <section className="mb-20 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {topics.map((topic) => (
          <article key={topic.title} className="rounded-xl border border-stone-lighter bg-white p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <topic.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-primary">{topic.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-light">{topic.description}</p>
          </article>
        ))}
      </section>

      <section className="mb-20 grid items-center gap-10 rounded-3xl bg-[#e8f5f2] p-7 md:p-12 lg:grid-cols-2">
        <div>
          <Leaf className="h-12 w-12 text-secondary" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-bold text-primary">What buyers can include in a brief</h2>
          <p className="mt-4 leading-7 text-stone-600">
            Tell us which evidence, materials, restricted substances, packaging preferences,
            supplier standards, or destination-market requirements matter to your project.
          </p>
        </div>
        <ul className="space-y-3 rounded-2xl bg-white p-6">
          {[
            'Required material composition or origin documents',
            'Restricted substance or test-report requirements',
            'Recycled-content evidence requirements',
            'Packaging material and labeling preferences',
            'Supplier social-compliance document requirements',
            'Destination-market compliance questions',
          ].map((item) => (
            <li key={item} className="flex gap-3 text-stone-700">
              <FileCheck2 className="mt-0.5 h-5 w-5 flex-none text-secondary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-primary p-10 text-center text-white md:p-14">
        <h2 className="text-2xl font-bold md:text-3xl">Share your responsible-sourcing brief</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          KARUU will review what can be supported for the selected product and identify items
          that still need confirmation.
        </p>
        <Link
          href="/contact"
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-8 py-3.5 font-semibold text-primary transition-colors hover:bg-accent-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Start the Review
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
