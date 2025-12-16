import { AuthProvider } from '@/components/auth-provider';
import { DesignProvider } from '@/components/design-provider';
import { DesignToggle } from '@/components/design-toggle';
import { SiteConfigProvider } from '@/components/site-config-provider';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import type React from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Drafter5000 - AI-Powered Article Writing',
  description: 'Generate personalized articles in your unique writing style with AI',
  generator: 'drafter-mvp.vercel.app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="win95-design">
      <body className={`${inter.className} font-sans antialiased`}>
        <DesignProvider>
          <SiteConfigProvider>
            <AuthProvider>{children}</AuthProvider>
          </SiteConfigProvider>
          <DesignToggle />
        </DesignProvider>
        <Analytics />
      </body>
    </html>
  );
}
