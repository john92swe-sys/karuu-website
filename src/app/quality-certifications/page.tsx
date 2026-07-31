import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  MessageSquareText,
  PackageCheck,
  Ruler,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata: Metadata = {
  title: 'Quality Process & Documentation',
  description:
    'How KARUU coordinates product specifications, sample approval, quality requirements, documentation review, and pre-shipment communication.',
  alternates: { canonical: '/quality-certifications' },
};

const reviewAreas = [
  {
    icon: Ruler,
    title: 'Product Specifications',
    description: 'Materials, dimensions, construction, colors, sizing, and finish requirements are recorded.',
  },
  {
    icon: ClipboardCheck,
    title: 'Sample Approval',
    description: 'Approved samples and requested changes provide the reference for the order.',
  },
  {
    icon: FileSearch,
    title: 'Document Review',
    description: 'Available material, test, or compliance documents are reviewed without inventing claims.',
  },
  {
    icon: CheckCircle2,
    title: 'Inspection Alignment',
    description: 'Inspection scope and acceptance expectations are discussed before production.',
  },
  {
    icon: PackageCheck,
    title: 'Packaging Check',
    description: 'Label, packing, carton, and shipment requirements are confirmed for the order.',
  },
  {
    icon: MessageSquareText,
    title: 'Issue Communication',
    description: 'Questions, changes, and corrective actions are communicated through clear approval points.',
  },
];

export default function QualityPage() {
  return (
    <main className="container mx-auto px-6 pb-20 pt-28">
      <Breadcrumb items={[{ label: 'Quality Process' }]} />

      <section className="mb-16 mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Quality Communication
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-primary md:text-5xl">
          Verify what matters before an order moves forward
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-light">
          KARUU coordinates specifications, samples, documentation, and inspection
          expectations for B2B activewear projects. Certifications are product- and
          supplier-specific and are only communicated when supporting documents are available.
        </p>
      </section>

      <section className="mb-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviewAreas.map((area) => (
          <article
            key={area.title}
            className="rounded-xl border border-stone-lighter bg-white p-8 transition-all hover:border-secondary/30 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <area.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-primary">{area.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-light">{area.description}</p>
          </article>
        ))}
      </section>

      <section className="mb-20 rounded-3xl bg-stone-faint p-7 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Typical Checkpoints
            </p>
            <h2 className="mt-3 text-3xl font-bold text-primary">A documented approval path</h2>
          </div>
          <ol className="space-y-4">
            {[
              'Confirm the buyer brief and required evidence.',
              'Review product specifications and available documentation.',
              'Approve samples and record requested changes.',
              'Align inspection, packaging, and delivery requirements.',
              'Confirm final order terms before production commitment.',
            ].map((step, index) => (
              <li key={step} className="flex gap-4 rounded-xl bg-white p-5">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="pt-1 text-stone-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-2xl bg-primary p-10 text-center text-white md:p-14">
        <h2 className="text-2xl font-bold md:text-3xl">Need specific documents for your market?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          Tell us which product and documentation you need. Availability will be checked and
          confirmed without unsupported certification claims.
        </p>
        <Link
          href="/contact"
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-8 py-3.5 font-semibold text-primary transition-colors hover:bg-accent-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Discuss Requirements
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
