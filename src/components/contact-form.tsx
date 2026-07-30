'use client';

import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    country: '',
    phone: '',
    product: '',
    quantity: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulated submission
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStatus('success');
    setFormData({
      name: '',
      email: '',
      company: '',
      country: '',
      phone: '',
      product: '',
      quantity: '',
      message: '',
    });
    setTimeout(() => setStatus('idle'), 5000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone mb-1.5">
            Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone mb-1.5">
            Email <span className="text-accent">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
            placeholder="your@company.com"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone mb-1.5">Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
            placeholder="Your company name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone mb-1.5">Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
            placeholder="Your country"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone mb-1.5">Phone / WhatsApp</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone mb-1.5">Product Interest</label>
          <select
            name="product"
            value={formData.product}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
          >
            <option value="">Select a category</option>
            <option value="yoga-leggings">Yoga Leggings</option>
            <option value="sports-bra">Sports Bra</option>
            <option value="yoga-shorts">Yoga Shorts</option>
            <option value="yoga-tops">Yoga Tops</option>
            <option value="outerwear">Outerwear & Jackets</option>
            <option value="full-collection">Full Collection</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone mb-1.5">Estimated Quantity</label>
        <input
          type="text"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
          placeholder="e.g. 500 pieces, 1000+ units"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone mb-1.5">Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-stone-lighter bg-white text-stone text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors resize-y"
          placeholder="Tell us about your project, requirements, timeline..."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-primary-light transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Message Sent!
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Inquiry
          </>
        )}
      </button>

      {status === 'success' && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/10 text-secondary text-sm flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>
            Thank you for your inquiry! Our team will review your message and get back to
            you within 24 hours.
          </span>
        </div>
      )}
    </form>
  );
}
