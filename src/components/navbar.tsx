'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { categoryLabels, type ProductCategory } from '@/lib/products';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/oem-odm', label: 'OEM / ODM' },
  { href: '/manufacturing', label: 'Manufacturing' },
  { href: '/quality-certifications', label: 'Quality & Certifications' },
  { href: '/about', label: 'About KARUU' },
  { href: '/contact', label: 'Contact', cta: true },
];

const productCategories: { slug: ProductCategory; label: string }[] = [
  { slug: 'yoga-leggings', label: categoryLabels['yoga-leggings'] },
  { slug: 'sports-bra', label: categoryLabels['sports-bra'] },
  { slug: 'yoga-shorts', label: categoryLabels['yoga-shorts'] },
  { slug: 'yoga-tops', label: categoryLabels['yoga-tops'] },
  { slug: 'outerwear-jackets', label: categoryLabels['outerwear-jackets'] },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProductMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 md:h-[72px] transition-all duration-300 ${
        scrolled
          ? 'bg-white/97 backdrop-blur-md shadow-sm border-b border-border'
          : 'bg-white/90 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-container h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg font-heading">
            K
          </div>
          <span className="font-heading font-bold text-lg text-primary tracking-tight">
            KARUU <span className="font-light text-secondary">AB</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
          {navItems.slice(0, -1).map((item) => {
            if (item.href === '/products') {
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setProductMenuOpen(true)}
                  onMouseLeave={() => setProductMenuOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={`inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'text-primary bg-primary-50'
                        : 'text-stone hover:text-primary hover:bg-bg-alt'
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </Link>
                  {productMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg border border-border shadow-lg py-2 animate-fade-in">
                      {productCategories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          className="block px-4 py-2 text-sm text-stone hover:text-primary hover:bg-bg-alt transition-colors"
                        >
                          {cat.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'text-primary bg-primary-50'
                    : 'text-stone hover:text-primary hover:bg-bg-alt'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="ml-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-light transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          >
            Contact
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-primary hover:bg-primary-50"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div id="mobile-navigation" className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg max-h-[calc(100dvh-64px)] overflow-y-auto">
          <nav className="flex flex-col py-3 px-4 gap-1">
            {navItems.slice(0, -1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'text-primary bg-primary-50'
                    : 'text-stone hover:bg-bg-alt'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="px-4 pt-2 pb-1 text-xs font-semibold text-stone-light uppercase tracking-wider">
              Product Categories
            </div>
            {productCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="px-8 py-2.5 text-sm text-stone-light hover:text-primary hover:bg-bg-alt rounded-md"
              >
                {cat.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mx-4 mt-4 py-3 text-center text-sm font-semibold text-white bg-primary rounded-md"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
