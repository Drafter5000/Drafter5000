'use client';

import type React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for error from invalid reset link
    const errorParam = searchParams.get('error');
    if (errorParam === 'invalid_reset_link') {
      setError('The password reset link is invalid or has expired. Please request a new one.');
    }
  }, [searchParams]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
      <div className="min-h-screen bg-white overflow-hidden relative">
        <Header />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <main className="pt-32 pb-20 px-6 relative z-10">
          <Card
            className={`max-w-md mx-auto border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <CardHeader className="text-center pb-2 pt-8">
              <div
                className={`inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 mx-auto shadow-xl shadow-emerald-500/30 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-base text-gray-500">
                We&apos;ve sent a password reset link to
              </CardDescription>
              <p className="text-primary font-medium mt-1">{email}</p>
            </CardHeader>

            <CardContent className="px-8 pb-8 space-y-4">
              <a
                href={getEmailProviderUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full h-12 text-base shadow-lg shadow-primary/25 gap-2 group transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
                  <Mail className="h-4 w-4" />
                  Open Email App
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>

              <Link href="/login" className="block">
                <Button variant="outline" className="w-full h-12 text-base gap-2 group">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to Login
                </Button>
              </Link>

              <p className="text-sm text-gray-500 text-center pt-4">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-primary font-medium hover:underline"
                >
                  try again
                </button>
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden relative">
      <Header />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Floating 3D shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-32 left-[10%] w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{ animation: mounted ? 'float 6s ease-in-out infinite' : 'none' }}
        />
        <div
          className={`absolute top-48 right-[15%] w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/10 shadow-lg transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{ animation: mounted ? 'float 7s ease-in-out infinite reverse' : 'none' }}
        />
        <div
          className={`absolute bottom-40 left-[20%] w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-400/20 to-violet-500/10 shadow-lg transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ animation: mounted ? 'float 8s ease-in-out infinite' : 'none' }}
        />
      </div>

      <main className="pt-32 pb-20 px-6 relative z-10">
        <Card
          className={`max-w-md mx-auto border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <CardHeader className="text-center pb-2 pt-8">
            <div
              className={`inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 mx-auto shadow-xl shadow-primary/30 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
            >
              <KeyRound className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-base text-gray-500">
              No worries, we&apos;ll send you reset instructions
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium flex items-center gap-2 text-gray-700"
                >
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-12 text-base shadow-lg shadow-primary/25 mt-2 gap-2 group transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1 group"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
