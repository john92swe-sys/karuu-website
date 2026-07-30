'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, ChevronUp } from 'lucide-react';

export function FloatingActions() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* WhatsApp */}
      <a
        href="https://wa.me/46708802017?text=Hi%20KARUU%20team%2C%20I%27d%20like%20to%20inquire%20about%20yoga%20apparel%20wholesale."
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className={`w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transition-all ${
          visible
            ? 'opacity-100 translate-y-0 pointer-events-auto hover:bg-primary-light hover:scale-110'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Back to top"
        title="Back to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
