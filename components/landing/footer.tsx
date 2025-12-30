'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useSiteConfigContext } from '@/components/site-config-provider';

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

export function Footer() {
  const { siteName, logoUrl, loading: configLoading } = useSiteConfigContext();

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
