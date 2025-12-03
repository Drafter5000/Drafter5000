'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { PenLine, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

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
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="border-2 bg-transparent">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="shadow-lg shadow-primary/20">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
