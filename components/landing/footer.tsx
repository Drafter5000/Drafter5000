'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useSiteConfigContext } from '@/components/site-config-provider';
import { useToast } from '@/hooks/use-toast';
import { apiClient, APIError } from '@/lib/api-client';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/pricing' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Contact', href: '/contact' },
  ],
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export function Footer() {
  const { siteName, logoUrl, loading: configLoading } = useSiteConfigContext();
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    if (!contactForm.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!contactForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!contactForm.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!contactForm.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/contact', contactForm);

      toast({
        title: 'Message sent!',
        description: "Thanks for reaching out. We'll get back to you soon.",
      });

      setContactForm(initialFormData);
      setErrors({});
    } catch (error: unknown) {
      const message =
        error instanceof APIError
          ? error.message
          : 'Failed to send message. Please try again later.';

      toast({
        title: 'Failed to send message',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg mb-4">
              {configLoading ? (
                <Skeleton className="h-9 w-9 rounded-xl" />
              ) : (
                <Image
                  src={logoUrl}
                  alt={`${siteName} Logo`}
                  width={36}
                  height={36}
                  className="rounded-xl"
                />
              )}
              {configLoading ? <Skeleton className="h-5 w-24" /> : <span>{siteName}</span>}
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
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className={`h-9 text-sm ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={`h-9 text-sm ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Subject"
                  value={contactForm.subject}
                  onChange={e => handleChange('subject', e.target.value)}
                  className={`h-9 text-sm ${errors.subject ? 'border-destructive' : ''}`}
                />
                {errors.subject && (
                  <p className="text-xs text-destructive mt-1">{errors.subject}</p>
                )}
              </div>
              <div>
                <Textarea
                  placeholder="Your message"
                  value={contactForm.message}
                  onChange={e => handleChange('message', e.target.value)}
                  className={`text-sm min-h-[80px] resize-none ${errors.message ? 'border-destructive' : ''}`}
                />
                {errors.message && (
                  <p className="text-xs text-destructive mt-1">{errors.message}</p>
                )}
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
