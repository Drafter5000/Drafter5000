'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { checkPasswordRequirements, validatePassword } from '@/lib/password-validation';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const requirements = checkPasswordRequirements(password);

  useEffect(() => {
    setMounted(true);

    // Check if user has a valid session for password reset
    const checkSession = async () => {
      const supabase = getBrowserSupabaseClient();

      // Handle hash fragment from Supabase (for recovery links)
      // Supabase sends recovery links with hash fragments like #access_token=...&type=recovery
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken) {
          // Set the session from the hash fragment
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (!error) {
            // Clear the hash from URL for cleaner display
            window.history.replaceState(null, '', window.location.pathname);
            setIsValidSession(true);
            return;
          }
        }
      }

      // Check if there's an existing valid session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-white overflow-hidden relative">
        <Header />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <main className="pt-32 pb-20 px-6 relative z-10">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Verifying reset link...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state if session is invalid
  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-white overflow-hidden relative">
        <Header />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <main className="pt-32 pb-20 px-6 relative z-10">
          <Card className="max-w-md mx-auto border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 mb-4 mx-auto shadow-xl shadow-destructive/30">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Link Expired
              </CardTitle>
              <CardDescription className="text-base text-gray-500">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Link href="/forgot-password">
                <Button className="w-full h-12 text-base shadow-lg shadow-primary/25 gap-2 group transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
                  Request New Reset Link
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-primary font-medium hover:underline">
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
                Password Reset!
              </CardTitle>
              <CardDescription className="text-base text-gray-500">
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <Button
                onClick={() => router.push('/login')}
                className="w-full h-12 text-base shadow-lg shadow-primary/25 gap-2 group transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Continue to Login
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
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
              Set New Password
            </CardTitle>
            <CardDescription className="text-base text-gray-500">
              Create a strong password for your account
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
                  htmlFor="password"
                  className="text-sm font-medium flex items-center gap-2 text-gray-700"
                >
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                  New Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  onFocus={() => setShowRequirements(true)}
                  disabled={loading}
                  className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                />

                {/* Password Requirements */}
                {showRequirements && password && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">Password requirements:</p>
                    <RequirementItem met={requirements.minLength} text="At least 8 characters" />
                    <RequirementItem
                      met={requirements.hasUppercase}
                      text="One uppercase letter (A-Z)"
                    />
                    <RequirementItem
                      met={requirements.hasLowercase}
                      text="One lowercase letter (a-z)"
                    />
                    <RequirementItem met={requirements.hasNumber} text="One number (0-9)" />
                    <RequirementItem
                      met={requirements.hasSpecialChar}
                      text="One special character (!@#$%...)"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium flex items-center gap-2 text-gray-700"
                >
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full h-12 text-base shadow-lg shadow-primary/25 mt-2 gap-2 group transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Remember your password? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
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

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${met ? 'text-emerald-600' : 'text-gray-500'}`}
    >
      {met ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <X className="h-3.5 w-3.5 text-gray-400" />
      )}
      <span>{text}</span>
    </div>
  );
}
