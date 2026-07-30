import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-stone-light" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-primary transition-colors">
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-stone-lighter">/</span>
          {item.isCurrent ? (
            <span className="text-stone font-medium" aria-current="page">
              {item.label}
            </span>
          ) : item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-stone font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
