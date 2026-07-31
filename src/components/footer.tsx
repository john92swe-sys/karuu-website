import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

const productLinks = [
  ['Yoga Leggings', '/products?category=yoga-leggings'],
  ['Sports Bra', '/products?category=sports-bra'],
  ['Yoga Shorts', '/products?category=yoga-shorts'],
  ['Yoga Tops', '/products?category=yoga-tops'],
  ['Outerwear & Jackets', '/products?category=outerwear-jackets'],
];

const companyLinks = [
  ['About KARUU', '/about'],
  ['OEM / ODM Service', '/oem-odm'],
  ['Manufacturing', '/manufacturing'],
  ['Quality Process', '/quality-certifications'],
  ['Responsible Sourcing', '/sustainability'],
];

function FooterLinks({ title, links }: { title: string; links: string[][] }) {
  return (
    <details className="footer-links border-t border-white/10 pt-4 md:border-0 md:pt-0">
      <summary className="footer-summary text-white font-heading font-semibold text-sm uppercase tracking-widest mb-4 cursor-pointer md:cursor-default">
        {title}
      </summary>
      <ul className="space-y-2.5 pb-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-white/60 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-white/80 pt-12 md:pt-14 pb-6">
      <div className="max-w-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary to-primary-light flex items-center justify-center text-white font-bold text-lg font-heading">
                K
              </div>
              <span className="font-heading font-bold text-lg text-white tracking-tight">
                KARUU <span className="font-light text-secondary-light">AB</span>
              </span>
            </div>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Swedish B2B activewear sourcing and manufacturing partner connecting global
              brands with selected manufacturing capabilities.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary-light" />
                <span className="text-white/60">Vattugatan 2A, 302 33 Halmstad, Sweden</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 flex-shrink-0 text-secondary-light" />
                <a href="mailto:info@karuu.se" className="text-white/60 hover:text-white">
                  info@karuu.se
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 flex-shrink-0 text-secondary-light" />
                <a href="tel:+46708802017" className="text-white/60 hover:text-white">
                  +46 70 880 2017
                </a>
              </div>
            </div>
          </div>

          {/* Products */}
          <FooterLinks title="Products" links={productLinks} />

          {/* Company */}
          <FooterLinks title="Company" links={companyLinks} />

          {/* WhatsApp CTA */}
          <div>
            <h4 className="text-white font-heading font-semibold text-sm uppercase tracking-widest mb-4">
              Instant Contact
            </h4>
            <p className="text-sm text-white/60 mb-4">
              Need a quick quote? Send your requirements directly to our team on WhatsApp.
            </p>
            <a
              href="https://wa.me/46708802017?text=Hi%20KARUU%20team%2C%20I%27d%20like%20to%20inquire%20about%20yoga%20apparel%20wholesale."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white font-semibold text-sm rounded-md hover:bg-[#128C7E] transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/40">
                Reg. No: 559244-1892<br />
                Bolagsverket, Sweden
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} KARUU AB. All rights reserved.</p>
          <p>Swedish company registration: 559244-1892</p>
        </div>
      </div>
    </footer>
  );
}
