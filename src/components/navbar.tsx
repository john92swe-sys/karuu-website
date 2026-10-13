'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, Search, UserRound, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
const links = [['/physical', 'Physical products'], ['/creations', 'Digital creations'], ['/about', 'About'], ['/contact', 'Contact']];
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return <><a className="c-skip" href="#main-content">Skip to content</a><header className="c-header"><div className="c-container c-nav-row">
    <Link href="/" className="c-wordmark" aria-label="KARUU home">KARUU<span className="c-brand-dot" /></Link>
    <nav className="c-desktop-nav" aria-label="Primary navigation">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}>{label}</Link>)}</nav>
    <div className="c-nav-actions">
      <Link href="/account" className="c-icon-link" aria-label="Your account"><UserRound size={21} /></Link>
      <Link href="/bag" className="c-icon-link" aria-label="Shopping bag"><ShoppingBag size={20} /></Link>
      <form action="/search" method="get" className="c-navbar-search" role="search" aria-label="Search KARUU">
        <button type="submit" aria-label="Search KARUU"><Search size={19} /></button>
        <Input type="search" name="q" aria-label="Search products, books, music and games" placeholder="Search products, books, music…" />
      </form>
      <Link href="/search" className="c-icon-link c-search-link" aria-label="Search products and creations"><Search size={20} /></Link>
      <button ref={menuButton} className="c-icon-link c-menu-toggle" aria-controls="c-mobile-menu" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div></div>
    {open && <nav id="c-mobile-menu" className="c-mobile-nav" aria-label="Mobile navigation">{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={17} /></Link>)}<Link href="/search" onClick={() => setOpen(false)}>Search products and creations<Search size={17} /></Link><Link href="/member-benefits" onClick={() => setOpen(false)}>Member benefits<ArrowUpRight size={17} /></Link></nav>}</header></>;
}
