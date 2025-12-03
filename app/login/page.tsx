'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render login form if user is logged in (will redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Auth state change will trigger redirect via useEffect
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header />
      <main className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>

        <Card className="max-w-md mx-auto border-2 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4 mx-auto">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-base">Sign in to your Drafter account</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base shadow-lg shadow-primary/20 mt-2 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{"Don't have an account? "}</span>
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Sign up free
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
