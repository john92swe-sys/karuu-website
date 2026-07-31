import type { Metadata } from 'next';
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  MessageCircle,
  Package,
  Building,
  Headphones,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import ContactForm from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Contact Us | KARUU Yoga Apparel Wholesale',
  description:
    'Get in touch with KARUU AB for yoga apparel wholesale, OEM/ODM inquiries. Swedish headquarters and Asian support team ready to help.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <Breadcrumb items={[{ label: 'Contact' }]} />

      <div className="mt-8 mb-16 max-w-3xl">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">
          Get In Touch
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 mb-6 leading-tight">
          Let&apos;s Build Something
          <br />
          <span className="text-secondary">Great Together</span>
        </h1>
        <p className="text-lg text-stone-light leading-relaxed">
          Whether you&apos;re looking for wholesale yoga apparel, custom OEM/ODM services,
          or have questions about our products, our team is here to help. We typically
          respond within 24 hours.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-20">
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white border border-stone-lighter hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-primary">Sweden HQ</h3>
            </div>
            <div className="space-y-2 text-sm text-stone-light">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
                Vattugatan 2A, 302 33 Halmstad, Sweden
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-secondary" />
                info@karuu.se
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-secondary" />
                +46 70 880 2017
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-secondary" />
                Mon – Fri, 09:00 – 17:00 CET
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-stone-lighter hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-primary">Sales & Support</h3>
            </div>
            <div className="space-y-2 text-sm text-stone-light">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-secondary" />
                sales@karuu.se
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 flex-shrink-0 text-secondary" />
                WhatsApp: +46 70 880 2017
              </p>
              <p className="flex items-center gap-2">
                <Package className="w-4 h-4 flex-shrink-0 text-secondary" />
                Response: within 24 hours
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-primary text-white">
            <h3 className="font-semibold text-lg mb-3">
              <MessageCircle className="w-5 h-5 inline mr-2" />
              Quick WhatsApp Chat
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Need a fast answer? Chat with our team directly on WhatsApp.
            </p>
            <a
              href="https://wa.me/46708802017"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1ebe57] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="p-8 rounded-2xl bg-white border border-stone-lighter">
            <h2 className="text-2xl font-bold text-primary mb-2">Send Us a Message</h2>
            <p className="text-stone-light mb-6 text-sm">
              Fill out the form below and we&apos;ll get back to you within 24 hours.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
