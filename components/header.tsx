'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { DesignContext } from '@/components/design-provider';
import { PenLine, Sparkles, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const context = useContext(DesignContext);
  const toggleAndReload = context?.toggleAndReload;
  const [mounted, setMounted] = useState(false);

  const isLoginPage = pathname === '/login';
  const isSignupPage = pathname === '/signup';
  const isPricingPage = pathname === '/pricing';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <PenLine className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span>Drafter</span>
        </Link>
        <nav className="flex items-center gap-4">
          {/* Win95 design toggle - temporarily hidden
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAndReload}
            className="hidden sm:flex items-center gap-1.5 rounded-lg"
            title="Switch to Win95 Design"
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden md:inline">Win95</span>
          </Button>
          */}
          {!isPricingPage && (
            <>
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
              >
                Pricing
              </Link>
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary"
              >
                Features
              </a>
            </>
          )}
          {!loading && (
            <>
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="shadow-lg shadow-primary/20 gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  {!isLoginPage && (
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-all duration-200"
                      >
                        Login
                      </Button>
                    </Link>
                  )}
                  {!isSignupPage && (
                    <Link href="/articles/generate/step-1">
                      <Button
                        size="sm"
                        className="font-semibold rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5"
                      >
                        Get Started
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
