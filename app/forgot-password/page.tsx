'use client';

import type React from 'react';
import { useState } from 'react';
import { Win95Window, Win95Button, Win95Input, Win95Alert } from '@/components/win95';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getEmailProviderUrl = () => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return 'https://mail.google.com';
    if (domain.includes('gmail')) return 'https://mail.google.com';
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live'))
      return 'https://outlook.live.com';
    if (domain.includes('yahoo')) return 'https://mail.yahoo.com';
    return 'https://mail.google.com';
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          <Win95Window title="Check Your Email - Drafter" icon={<span>📧</span>}>
            <div className="p-4 text-center">
              <div className="text-[48px] mb-2">📧</div>
              <h2 className="text-[14px] font-bold mb-2">Check Your Email</h2>
              <p className="text-[11px] mb-1">We've sent a password reset link to</p>
              <p className="text-[11px] font-bold mb-4">{email}</p>

              <div className="space-y-2 max-w-[200px] mx-auto">
                <a href={getEmailProviderUrl()} target="_blank" rel="noopener noreferrer">
                  <Win95Button size="lg" className="w-full">
                    Open Email
                  </Win95Button>
                </a>
                <Link href="/login">
                  <Win95Button size="lg" className="w-full">
                    Back to Login
                  </Win95Button>
                </Link>
              </div>
            </div>
          </Win95Window>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <Win95Window title="Forgot Password - Drafter" showControls={true} icon={<span>🔑</span>}>
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="text-[32px] mb-2">🔑</div>
              <h1 className="text-[14px] font-bold">Forgot Your Password?</h1>
              <p className="text-[11px] text-[var(--win95-button-shadow)]">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Win95Alert type="error" title="Error">
                  {error}
                </Win95Alert>
              )}

              <Win95Input
                label="Email Address *"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />

              <div className="flex justify-center pt-2">
                <Win95Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  size="lg"
                  className={loading ? 'win95-loading' : ''}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Win95Button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-[var(--win95-button-shadow)] text-center">
              <p className="text-[11px]">
                Remember your password?{' '}
                <Link href="/login" className="text-[var(--win95-link)] underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </Win95Window>
      </div>
    </div>
  );
}
