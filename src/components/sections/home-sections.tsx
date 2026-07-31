import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import {
  Award,
  Leaf,
  ShieldCheck,
  Truck,
  Gem,
  Factory,
  ArrowRight,
  Palette,
  PackageCheck,
} from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative bg-primary text-white overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#0f2742]" />

      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 container mx-auto px-5 py-16 sm:px-6 md:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Swedish B2B Activewear Partner
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Build Your Activewear Range
            <br />
            <span className="text-accent">With Clear Coordination</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
            KARUU connects global brands with selected manufacturing capabilities through
            sourcing, product development, OEM/ODM coordination, and international service.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-accent text-primary px-7 py-3.5 rounded-lg font-semibold hover:bg-accent-light transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Explore Collection
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-white/30 text-white px-7 py-3.5 rounded-lg font-semibold hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              Request Quote
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <span>Selected Sourcing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Truck className="w-5 h-5 text-accent" />
              <span>Product Development</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Award className="w-5 h-5 text-accent" />
              <span>International Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 80L48 73.3C96 66.7 192 53.3 288 46.7C384 40 480 40 576 43.3C672 46.7 768 53.3 864 53.3C960 53.3 1056 46.7 1152 40C1248 33.3 1344 26.7 1392 23.3L1440 20V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="#FFFFFF" />
        </svg>
      </div>
    </section>
  );
}

export function CoreAdvantagesSection() {
  const advantages = [
    {
      icon: Gem,
      title: 'Selected Sourcing',
      desc: 'Product options are reviewed against your brief, positioning, and target market.',
    },
    {
      icon: Leaf,
      title: 'Product Development',
      desc: 'Specifications, samples, and approval points are coordinated from brief to order.',
    },
    {
      icon: ShieldCheck,
      title: 'Quality Communication',
      desc: 'Product requirements and inspection expectations are aligned before ordering.',
    },
    {
      icon: Factory,
      title: 'International Service',
      desc: 'A Swedish B2B contact point supports communication across markets and time zones.',
    },
  ];

  return (
    <section className="section-spacing bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            Why KARUU
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-4">
            A Clearer Path From Product Brief to Delivery
          </h2>
          <p className="text-stone-light">
            KARUU focuses on sourcing, product development, OEM/ODM coordination, quality
            communication, and practical international support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((a, i) => (
            <div
              key={i}
              className="group p-8 rounded-xl border border-stone-lighter bg-white hover:border-secondary/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-5 group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                <a.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{a.title}</h3>
              <p className="text-stone-light text-sm leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedCollectionSection() {
  const products = getFeaturedProducts(4);

  return (
    <section className="section-spacing bg-stone-faint">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">
              Featured Collection
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">
              Featured Yoga Wear
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:text-secondary transition-colors group"
          >
            View All Products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DocumentationSection() {
  return (
    <section className="section-spacing bg-white">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto rounded-2xl bg-gradient-to-br from-secondary/20 via-stone-faint to-accent/10 flex items-center justify-center overflow-hidden">
              <div className="text-center p-10">
                <div className="w-28 h-28 mx-auto rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
                  <Award className="w-14 h-14 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-2">Product Review</h3>
                <p className="text-stone-light text-sm">Specifications and documentation</p>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-4 border border-stone-lighter">
              <div className="text-sm font-bold text-primary">Product files</div>
              <div className="text-xs text-stone-light">Reviewed per inquiry</div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 border border-stone-lighter">
              <div className="text-sm font-bold text-primary">Requirements</div>
              <div className="text-xs text-stone-light">Confirmed before ordering</div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-widest">
              Product Coordination
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
              Clear Specification and Documentation Review
            </h2>
            <p className="text-stone-light leading-relaxed mb-6">
              Product details are reviewed against available documentation and buyer
              requirements. Material composition, sizing, customization, sampling, and
              production terms are confirmed before an order is placed.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                'Document confirmed product specifications',
                'Align buyer requirements before sampling',
                'Record sample and approval decisions',
                'Confirm order terms before production',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-stone">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/quality-certifications"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-secondary transition-colors group"
            >
              Learn more about quality communication
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PartnershipSection() {
  const steps = [
    {
      icon: Palette,
      title: 'Define Your Product',
      content: 'Share your target styles, colors, sizing, branding, and order requirements.',
    },
    {
      icon: Factory,
      title: 'Develop & Sample',
      content: 'Review materials and specifications, then validate the product with samples.',
    },
    {
      icon: PackageCheck,
      title: 'Approve & Produce',
      content: 'Confirm the approved sample, production details, quality checks, and delivery plan.',
    },
  ];

  return (
    <section className="section-spacing bg-stone-faint">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            How We Work
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-4">
            A Clear Path From Brief to Production
          </h2>
          <p className="text-stone-light">
            Our team keeps product decisions, approvals, and next steps visible throughout
            the OEM/ODM process.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-7 border border-stone-lighter hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-stone-lighter">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{step.title}</h3>
              <p className="text-sm text-stone-light leading-relaxed">{step.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeContactSection() {
  return (
    <section className="section-spacing bg-primary text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">
            Get In Touch
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            Ready to Elevate Your Yoga Brand?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Contact our team to discuss your product brief, sampling needs, and quote requirements.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-accent text-primary px-7 py-3.5 rounded-lg font-semibold hover:bg-accent-light transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Contact Us Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/46708802017"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-white/30 text-white px-7 py-3.5 rounded-lg font-semibold hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="mt-10 pt-8 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-base font-bold text-accent">Product Consultation</div>
              <div className="text-sm text-white/60">Discuss styles and specifications</div>
            </div>
            <div>
              <div className="text-base font-bold text-accent">OEM / ODM Support</div>
              <div className="text-sm text-white/60">Develop your private-label range</div>
            </div>
            <div>
              <div className="text-base font-bold text-accent">Quote Request</div>
              <div className="text-sm text-white/60">Receive a scope-based proposal</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
