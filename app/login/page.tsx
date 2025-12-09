'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Win95Window, Win95Button, Win95Input, Win95Alert } from '@/components/win95';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import Link from 'next/link';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Win95Window title="Loading..." showControls={false}>
          <div className="p-4 text-center text-[11px]">
            <span className="win95-loading">Loading...</span>
          </div>
        </Win95Window>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Win95Window title="Redirecting..." showControls={false}>
          <div className="p-4 text-center text-[11px]">Redirecting to dashboard...</div>
        </Win95Window>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <Win95Window title="Log In - Drafter" showControls={true} icon={<span>🔐</span>}>
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="text-[32px] mb-2">🔐</div>
              <h1 className="text-[14px] font-bold">Welcome back</h1>
              <p className="text-[11px] text-[var(--win95-button-shadow)]">
                Sign in to your Drafter account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Win95Alert type="error" title="Error">
                  {error}
                </Win95Alert>
              )}

              <Win95Input
                label="Email *"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
                disabled={loading}
                error={fieldErrors.email}
              />

              <Win95Input
                label="Password *"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors(prev => ({ ...prev, password: undefined }));
                }}
                disabled={loading}
                error={fieldErrors.password}
              />

              <div className="flex justify-center pt-2">
                <Win95Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className={loading ? 'win95-loading' : ''}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Win95Button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-[var(--win95-button-shadow)] text-center">
              <p className="text-[11px]">
                {"Don't have an account? "}
                <Link href="/signup" className="text-[var(--win95-link)] underline">
                  Sign up free
                </Link>
              </p>
            </div>
          </div>
        </Win95Window>
      </div>
    </div>
  );
}
