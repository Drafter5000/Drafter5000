'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { useSiteConfigContext } from '@/components/site-config-provider';
import { DesignContext } from '@/components/design-provider';
import { Sparkles, Menu, X, Monitor } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Testimonials', href: '#customer-stories' },
  { name: 'Pricing', href: '/pricing' },
];

interface MarketingHeaderProps {
  hideNavLinks?: boolean;
}

export function MarketingHeader({ hideNavLinks = false }: MarketingHeaderProps) {
  const { user, loading } = useAuth();
  const { siteName, logoUrl, loading: configLoading } = useSiteConfigContext();
  const pathname = usePathname();
  const context = useContext(DesignContext);
  const toggleAndReload = context?.toggleAndReload;
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isSignupPage = pathname === '/signup';

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="h-14 w-14 rounded-xl overflow-hidden shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow"
            >
              {configLoading ? (
                <Skeleton className="h-10 w-10 rounded-xl" />
              ) : (
                <Image src={logoUrl} alt={`${siteName} Logo`} width={56} height={56} />
              )}
            </motion.div>
            {configLoading ? (
              <Skeleton className="hidden sm:block h-6 w-24" />
            ) : (
              <span className="hidden sm:inline">{siteName}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          {!hideNavLinks && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-xl hover:bg-secondary"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Design Toggle - temporarily hidden
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAndReload}
              className="hidden sm:flex items-center gap-1.5 rounded-xl"
              title="Switch to Win95 Design"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden md:inline">Win95</span>
            </Button>
            */}

            {!loading && (
              <>
                {user ? (
                  <Link href="/dashboard">
                    <Button className="shadow-lg shadow-primary/20 gap-2 rounded-xl">
                      <Sparkles className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <div className="hidden sm:flex items-center gap-3">
                    {!isLoginPage && (
                      <Link href="/login">
                        <Button
                          variant="ghost"
                          className="rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                        >
                          Login
                        </Button>
                      </Link>
                    )}
                    {!isSignupPage && (
                      <Link href="/articles/generate/step-1">
                        <Button className="rounded-xl font-semibold bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]">
                          Get Started
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 lg:hidden"
          >
            <div className="bg-background/95 backdrop-blur-xl border-b border-border shadow-xl mx-4 rounded-2xl overflow-hidden">
              <nav className="p-4 space-y-2">
                {!hideNavLinks &&
                  navLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-base font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-3 rounded-xl hover:bg-secondary"
                    >
                      {link.name}
                    </Link>
                  ))}
                {!user && (
                  <div className="pt-4 border-t border-border space-y-3">
                    {!isLoginPage && (
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl font-medium border-2 hover:bg-secondary/80 transition-all duration-200"
                        >
                          Login
                        </Button>
                      </Link>
                    )}
                    {!isSignupPage && (
                      <Link
                        href="/articles/generate/step-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button className="w-full rounded-xl font-semibold bg-gradient-to-r from-primary to-chart-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200">
                          Get Started
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
