'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

type PublicProductCategory =
  | 'yoga-leggings'
  | 'sports-bra'
  | 'yoga-shorts'
  | 'yoga-tops'
  | 'outerwear-jackets';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/oem-odm', label: 'OEM / ODM' },
  { href: '/manufacturing', label: 'Manufacturing' },
  { href: '/quality-certifications', label: 'Quality Process' },
  { href: '/about', label: 'About KARUU' },
  { href: '/contact', label: 'Contact', cta: true },
];

const productCategories: { slug: PublicProductCategory; label: string }[] = [
  { slug: 'yoga-leggings', label: 'Yoga Leggings' },
  { slug: 'sports-bra', label: 'Sports Bras' },
  { slug: 'yoga-shorts', label: 'Yoga Shorts' },
  { slug: 'yoga-tops', label: 'Yoga Tops' },
  { slug: 'outerwear-jackets', label: 'Outerwear & Jackets' },
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
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border bg-white/95 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-white/88 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-container flex h-full items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-base font-bold text-white font-heading">
            K
          </div>
          <span className="text-base font-bold tracking-tight text-primary font-heading sm:text-lg">
            KARUU <span className="font-light text-secondary">AB</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary navigation">
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
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary'
                        : 'text-stone hover:bg-bg-alt hover:text-primary'
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </Link>
                  {productMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-border bg-white py-2 shadow-lg animate-fade-in">
                      {productCategories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/products?category=${category.slug}`}
                          className="block px-4 py-2 text-sm text-stone transition-colors hover:bg-bg-alt hover:text-primary"
                        >
                          {category.label}
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
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary'
                    : 'text-stone hover:bg-bg-alt hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="ml-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-light"
          >
            Contact
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-primary hover:bg-primary-50 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="absolute left-0 right-0 top-full max-h-[calc(100dvh-64px)] overflow-y-auto border-b border-border bg-white shadow-lg lg:hidden"
        >
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navItems.slice(0, -1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-4 py-3 text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary'
                    : 'text-stone hover:bg-bg-alt'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-stone-light">
              Product Categories
            </div>
            {productCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="rounded-md px-8 py-2.5 text-sm text-stone-light hover:bg-bg-alt hover:text-primary"
              >
                {category.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mx-4 mt-4 rounded-md bg-primary py-3 text-center text-sm font-semibold text-white"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
