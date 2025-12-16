'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/pricing' },
  ],
  company: [{ name: 'About', href: '#' }],
};

export function Footer() {
  const [contactForm, setContactForm] = useState({ email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
    setContactForm({ email: '', message: '' });
  };

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg mb-4">
              <Image
                src="/logo/logo.png"
                alt="Drafter5000 Logo"
                width={36}
                height={36}
                className="rounded-xl"
              />
              <span>Drafter5000</span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-xs">
              AI-powered content creation that sounds like you. Transform your writing workflow
              today.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us Form */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            {submitted ? (
              <p className="text-sm text-primary">Thanks! We'll get back to you soon.</p>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
                <Textarea
                  placeholder="Your message"
                  value={contactForm.message}
                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                  className="text-sm min-h-[80px] resize-none"
                />
                <Button type="submit" size="sm" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Drafter5000. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
