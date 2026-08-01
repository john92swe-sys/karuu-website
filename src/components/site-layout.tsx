import { Navbar } from './navbar';
import { Footer } from './footer';
import { FloatingActions } from './floating-actions';

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
