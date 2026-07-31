import { Navbar } from './navbar';
import { Footer } from './footer';
import { FloatingActions } from './floating-actions';

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16 md:pt-[72px]">{children}</main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
