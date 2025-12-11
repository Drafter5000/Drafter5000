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
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/signup', { name: name.trim(), email, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white overflow-hidden relative">
        <Header />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <main className="pt-32 pb-20 px-6 flex items-center justify-center relative z-10">
          <Card className="max-w-md mx-auto border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mb-4 mx-auto shadow-xl shadow-green-500/30">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Account created!
              </h2>
              <p className="text-gray-500 mb-6">Check your email to verify your account</p>
              <p className="text-sm text-gray-400">Redirecting to login...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden relative">
      <Header />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Floating 3D shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-32 left-[10%] w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(15deg) rotateY(-15deg) translateY(0)'
              : 'translateY(-40px)',
            animation: mounted ? 'float 6s ease-in-out infinite' : 'none',
          }}
        />
        <div
          className={`absolute top-48 right-[15%] w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/10 shadow-lg transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(-10deg) rotateY(20deg)'
              : 'translateY(-40px)',
            animation: mounted ? 'float 7s ease-in-out infinite reverse' : 'none',
          }}
        />
        <div
          className={`absolute bottom-40 left-[20%] w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-400/20 to-violet-500/10 shadow-lg transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(20deg) rotateY(10deg)'
              : 'translateY(40px)',
            animation: mounted ? 'float 8s ease-in-out infinite' : 'none',
          }}
        />
        <div
          className={`absolute bottom-56 right-[12%] w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/25 to-emerald-500/10 shadow-lg transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{
            transform: mounted
              ? 'perspective(500px) rotateX(-15deg) rotateY(-20deg)'
              : 'translateY(40px)',
            animation: mounted ? 'float 5s ease-in-out infinite reverse' : 'none',
          }}
        />
      </div>

      <main className="pt-32 pb-20 px-6 relative z-10">
        <Card
          className={`max-w-md mx-auto border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
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
              <User className="h-10 w-10 text-white" />
            </div>
            <CardTitle
              className={`text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Create your account
            </CardTitle>
            <CardDescription
              className={`text-base text-gray-500 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Join thousands of content creators
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium flex items-center gap-2 text-gray-700"
                >
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  disabled={loading}
                  className={`h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors ${fieldErrors.name ? 'border-destructive focus:border-destructive' : ''}`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (fieldErrors.password)
                        setFieldErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    disabled={loading}
                    className={`h-12 pr-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors ${fieldErrors.password ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {fieldErrors.password}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">At least 8 characters</p>
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
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword)
                        setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    disabled={loading}
                    className={`h-12 pr-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors ${fieldErrors.confirmPassword ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {fieldErrors.confirmPassword}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Already have an account? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

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
