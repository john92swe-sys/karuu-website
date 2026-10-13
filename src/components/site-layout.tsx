import { Navbar } from './navbar';
import { Footer } from './footer';
export function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col"><Navbar /><main id="main-content" className="flex-1 pt-16">{children}</main><Footer /></div>;
}