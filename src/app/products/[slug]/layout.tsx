import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'KARUU Product',
    template: '%s',
  },
};

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
