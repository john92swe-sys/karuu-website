import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export function Footer() {
  const groups = [
    { title: 'Products for life', links: [['Activewear collection', '/products'], ['OEM / ODM & private label', '/oem-odm'], ['JKJ-Plus collaboration', '/physical/jkj-plus'], ['Start a project', '/contact']] },
    { title: 'Stories to explore', links: [['Books & audio', '/creations'], ['Music', '/creations?category=music'], ['Games', '/creations?category=games'], ['My creations', '/account']] },
    { title: 'Here to help', links: [['About KARUU', '/about'], ['Member benefits', '/member-benefits'], ['Privacy', '/privacy'], ['Digital content & refunds', '/terms']] },
  ];
  return <footer className="c-footer"><div className="c-container"><div className="c-footer-grid"><div><Link href="/" className="c-wordmark">KARUU<span className="c-brand-dot" /></Link><p>Physical products and original digital creations.<br />From Halmstad, Sweden.</p><a href="mailto:john@karuu.net" className="c-text-link">john@karuu.net <ArrowUpRight size={15} /></a><p className="c-small">KARUU AB · Reg. No. 559244-1892<br />Vattugatan 2A, 302 33 Halmstad, Sweden<br /><a href="tel:+46708802017">+46 70 880 2017</a></p></div>{groups.map(group => <div key={group.title}><h2>{group.title}</h2><ul>{group.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>)}</div><div className="c-footer-bottom"><span>© {new Date().getFullYear()} KARUU AB</span><span>A little more life. A little more imagination.</span></div></div></footer>;
}