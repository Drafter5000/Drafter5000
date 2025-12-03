'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { PenLine, Sparkles, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Pricing', href: '/pricing' },
];

export function MarketingHeader() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow"
            >
              <PenLine className="h-5 w-5 text-white" />
            </motion.div>
            <span className="hidden sm:inline">Drafter</span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
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
                    <Link href="/login">
                      <Button variant="ghost" className="rounded-xl">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="shadow-lg shadow-primary/20 rounded-xl">
                        Get Started Free
                      </Button>
                    </Link>
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
                {navLinks.map((link, index) => (
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
                  <div className="pt-4 border-t border-border space-y-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-xl">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-xl shadow-lg shadow-primary/20">
                        Get Started Free
                      </Button>
                    </Link>
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
