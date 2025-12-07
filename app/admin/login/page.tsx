'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, AlertCircle, Loader2, ArrowRight, User } from 'lucide-react';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/auth/session');
        if (res.ok) {
          router.push('/admin');
        }
      } catch {
        // Not logged in, show login form
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Floating 3D shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 left-[15%] w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(15deg) rotateY(-15deg) translateY(0)'
              : 'translateY(-40px)',
            animation: mounted ? 'float 6s ease-in-out infinite' : 'none',
          }}
        />
        <div
          className={`absolute top-40 right-[20%] w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/10 shadow-lg transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(-10deg) rotateY(20deg)'
              : 'translateY(-40px)',
            animation: mounted ? 'float 7s ease-in-out infinite reverse' : 'none',
          }}
        />
        <div
          className={`absolute bottom-32 left-[25%] w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-400/20 to-violet-500/10 shadow-lg transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(20deg) rotateY(10deg)'
              : 'translateY(40px)',
            animation: mounted ? 'float 8s ease-in-out infinite' : 'none',
          }}
        />
        <div
          className={`absolute bottom-48 right-[15%] w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/25 to-emerald-500/10 shadow-lg transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(-15deg) rotateY(-20deg)'
              : 'translateY(40px)',
            animation: mounted ? 'float 5s ease-in-out infinite reverse' : 'none',
          }}
        />
      </div>

      {/* Main card with 3D effect */}
      <Card
        className={`w-full max-w-md border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{
          transform: mounted
            ? 'perspective(1000px) rotateX(2deg)'
            : 'perspective(1000px) rotateX(5deg) translateY(20px)',
        }}
      >
        <CardHeader className="text-center pb-2 pt-8">
          <div
            className={`inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 mx-auto shadow-xl shadow-primary/30 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
            style={{
              transform: mounted
                ? 'perspective(500px) rotateX(-10deg) rotateY(10deg)'
                : 'scale(0.75)',
            }}
          >
            <Shield className="h-10 w-10 text-white" />
          </div>
          <CardTitle
            className={`text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Admin Portal
          </CardTitle>
          <CardDescription
            className={`text-base text-gray-500 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Sign in to access the dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="admin@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
                disabled={loading}
                className={`h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors ${fieldErrors.email ? 'border-destructive focus:border-destructive' : ''}`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium flex items-center gap-2 text-gray-700"
              >
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors(prev => ({ ...prev, password: undefined }));
                }}
                disabled={loading}
                className={`h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors ${fieldErrors.password ? 'border-destructive focus:border-destructive' : ''}`}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base shadow-lg shadow-primary/25 mt-2 gap-2 group transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href="/login">
              <Button
                variant="ghost"
                className="w-full h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 gap-2 group"
              >
                <User className="h-4 w-4" />
                Go to User Portal
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            This area is restricted to administrators only.
          </p>
        </CardContent>
      </Card>

      {/* CSS for floating animation */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: perspective(500px) rotateX(15deg) rotateY(-15deg) translateY(0px);
          }
          50% {
            transform: perspective(500px) rotateX(15deg) rotateY(-15deg) translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
