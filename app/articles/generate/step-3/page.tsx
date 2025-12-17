'use client';

import { useAuth } from '@/components/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient } from '@/lib/api-client';
import { DAYS, LANGUAGES } from '@/lib/constants';
import {
  areAllDaysSelected,
  DayCode,
  toggleAllDays,
  toggleDay as toggleDayUtil,
} from '@/lib/day-selection';
import { DraftSessionService } from '@/lib/draft-session';
import { validateLinkedInSignupForm, validateSignupForm } from '@/lib/onboarding-validation';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Info,
  Loader2,
  Lock,
  Mail,
  Rocket,
  Sparkles,
  User,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface SignupResponse {
  success: boolean;
  user_id?: string;
  redirect_url?: string;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
  retry?: boolean;
}

interface UserProfile {
  email: string;
  display_name: string;
  job?: string;
}

function Step3LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
        <Skeleton className="h-8 w-52 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-2 pt-0 pb-6">
            <CardHeader className="py-4">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[1, 2].map(j => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-between items-center pt-6 border-t">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-11 w-52 rounded-md" />
      </div>
    </div>
  );
}

function GenerateStep3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [draftData, setDraftData] = useState<{
    style_samples: string[];
    subjects: string[];
  } | null>(null);

  const isLinkedInUser = searchParams.get('provider') === 'linkedin' || !!user;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [job, setJob] = useState('');
  const [frequency, setFrequency] = useState<DayCode[]>([]);
  const [language, setLanguage] = useState('en');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchLinkedInProfile = async () => {
      if (!isLinkedInUser || !user) return;

      try {
        const profile = await apiClient.get<UserProfile>('/auth/profile');
        if (profile) {
          if (profile.display_name) setName(profile.display_name);
          if (profile.email) setEmail(profile.email);
          if (profile.job) setJob(profile.job);
        }
      } catch (err) {
        console.error('Failed to fetch LinkedIn profile:', err);
      }
    };

    fetchLinkedInProfile();
  }, [isLinkedInUser, user]);

  useEffect(() => {
    if (isSubmitSuccess) return;

    const draftSession = DraftSessionService.load();

    if (!draftSession?.style_samples || draftSession.style_samples.length === 0) {
      const providerParam = isLinkedInUser ? '?provider=linkedin' : '';
      router.push(`/articles/generate/step-1${providerParam}`);
      return;
    }

    if (!draftSession?.subjects || draftSession.subjects.length === 0) {
      const providerParam = isLinkedInUser ? '?provider=linkedin' : '';
      router.push(`/articles/generate/step-2${providerParam}`);
      return;
    }

    if (!isLinkedInUser) {
      if (draftSession.name) setName(draftSession.name);
      if (draftSession.email) setEmail(draftSession.email);
    }
    // Job title is now collected in step-1, so load it for all users
    if (draftSession.job) setJob(draftSession.job);
    if (draftSession.delivery_days && draftSession.delivery_days.length > 0) {
      setFrequency(draftSession.delivery_days as DayCode[]);
    }
    if (draftSession.preferred_language) {
      setLanguage(draftSession.preferred_language);
    }

    setDraftData({
      style_samples: draftSession.style_samples,
      subjects: draftSession.subjects,
    });
    setInitialLoading(false);
  }, [router, isLinkedInUser, isSubmitSuccess]);

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId));
  };

  const isEveryday = areAllDaysSelected(frequency);

  const handleToggleEveryday = () => {
    setFrequency(prev => toggleAllDays(prev));
  };

  // Use different validation for LinkedIn users (no password required)
  const validation = isLinkedInUser
    ? validateLinkedInSignupForm({ name, email, job })
    : validateSignupForm({ name, email, password, confirmPassword, job });
  const isValid = validation.valid && frequency.length > 0;
  const selectedLanguage = LANGUAGES.find(l => l.code === language);

  const handleSubmit = async () => {
    if (!draftData) {
      setError('Please complete steps 1 and 2 first');
      return;
    }

    const result = isLinkedInUser
      ? validateLinkedInSignupForm({ name, email, job })
      : validateSignupForm({ name, email, password, confirmPassword, job });

    if (!result.valid) {
      setFieldErrors(result.errors);
      return;
    }
    if (frequency.length === 0) {
      setFieldErrors({
        ...result.errors,
        delivery_days: 'Please select at least one delivery day',
      });
      return;
    }
    setFieldErrors({});

    setLoading(true);
    setError(null);
    setCanRetry(true);

    try {
      const endpoint = isLinkedInUser
        ? '/auth/complete-linkedin-onboarding'
        : '/auth/signup-with-style';
      const payload = isLinkedInUser
        ? {
            job,
            style_samples: draftData.style_samples,
            subjects: draftData.subjects,
            preferred_language: language,
            delivery_days: frequency,
          }
        : {
            name,
            email,
            password,
            confirmPassword,
            job,
            style_samples: draftData.style_samples,
            subjects: draftData.subjects,
            preferred_language: language,
            delivery_days: frequency,
          };

      const response = await apiClient.post<SignupResponse>(endpoint, payload);

      if (response.success) {
        // Mark submission as successful to prevent useEffect from redirecting
        setIsSubmitSuccess(true);

        // Clear draft data on successful signup
        DraftSessionService.clear();

        // Use full page redirect to ensure auth cookies are properly read
        window.location.href = '/subscribe';
        return;
      } else {
        // Handle error response
        setError(response.error || 'Failed to save profile');
        setCanRetry(response.retry !== false);
        if (response.fields) {
          setFieldErrors(response.fields);
        }
      }
    } catch (err: unknown) {
      let errorMessage = isLinkedInUser
        ? 'Failed to save profile. Please try again.'
        : 'Failed to create account. Please try again.';
      let retry = true;

      if (err instanceof Error) {
        errorMessage = err.message;
        if (errorMessage.includes('already exists')) {
          retry = false;
        }
      }

      setError(errorMessage);
      setCanRetry(retry);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit();
  };

  const handleBack = () => {
    const providerParam = isLinkedInUser ? '?provider=linkedin' : '';
    router.push(`/articles/generate/step-2${providerParam}`);
  };

  // Show redirecting state when submission was successful
  if (isSubmitSuccess) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/20 border border-green-500/30 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Profile Saved!</h2>
            <p className="text-muted-foreground mt-2">Redirecting to subscription plans...</p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
          <Skeleton className="h-8 w-52 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Form Grid Skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Info Card Skeleton */}
          <Card className="border-2 pt-0 pb-6">
            <CardHeader className="py-4 bg-blue-500/5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Password Card Skeleton */}
          <Card className="border-2 pt-0 pb-6">
            <CardHeader className="py-4 bg-purple-500/5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-28" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[1, 2].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Days Card Skeleton */}
          <Card className="border-2 pt-0 pb-6">
            <CardHeader className="py-4 bg-green-500/5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-28" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language Card Skeleton */}
          <Card className="border-2 pt-0 pb-6">
            <CardHeader className="py-4 bg-amber-500/5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {/* Footer Skeleton */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-11 w-52 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <Rocket className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {isLinkedInUser ? 'Complete Your Profile' : 'Create Your Account'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isLinkedInUser
              ? 'Final step! Complete your profile to choose your plan and start receiving articles'
              : 'Final step! Sign up to choose your plan and start receiving articles'}
          </p>
        </div>
        {isLinkedInUser && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] text-sm font-medium">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Signed in with LinkedIn
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <div className="flex gap-2">
              {canRetry && (
                <Button variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
                  Try Again
                </Button>
              )}
              {!canRetry && error.includes('already exists') && (
                <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
                  Go to Login
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Delivery Days Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-green-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Delivery Days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div
              onClick={handleToggleEveryday}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isEveryday
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border hover:border-green-500/30'
              } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Checkbox checked={isEveryday} disabled={loading} />
              <span className={`font-semibold ${isEveryday ? 'text-green-600' : ''}`}>
                Every Day
              </span>
              {isEveryday && <Sparkles className="h-4 w-4 text-green-500 ml-auto" />}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DAYS.map(day => {
                const isSelected = frequency.includes(day.id);
                return (
                  <div
                    key={day.id}
                    onClick={() => !loading && handleToggleDay(day.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-border/50 hover:border-green-500/30'
                    } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Checkbox checked={isSelected} disabled={loading} />
                    <span className="text-sm font-medium">{day.short}</span>
                  </div>
                );
              })}
            </div>

            {frequency.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{frequency.length}</span> day
                  {frequency.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
            {fieldErrors.delivery_days && (
              <p className="text-xs text-destructive">{fieldErrors.delivery_days}</p>
            )}
          </CardContent>
        </Card>

        {/* Language Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-amber-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-500" />
              Article Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Select value={language} onValueChange={setLanguage} disabled={loading}>
              <SelectTrigger>
                <SelectValue>
                  {selectedLanguage && (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{selectedLanguage.flag}</span>
                      <span>{selectedLanguage.label}</span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedLanguage?.flag}</span>
                <div>
                  <p className="font-semibold">{selectedLanguage?.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Articles in {selectedLanguage?.label}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-blue-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Account Information
              {isLinkedInUser && (
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  From LinkedIn
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                Full Name {!isLinkedInUser && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading || isLinkedInUser}
                className={`${fieldErrors.name ? 'border-destructive' : ''} ${isLinkedInUser ? 'bg-muted' : ''}`}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address {!isLinkedInUser && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading || isLinkedInUser}
                className={`${fieldErrors.email ? 'border-destructive' : ''} ${isLinkedInUser ? 'bg-muted' : ''}`}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="job" className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Job Title <span className="text-destructive">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The AI will draft articles as if it was doing this job</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="job"
                placeholder="Marketing Manager"
                value={job}
                onChange={e => setJob(e.target.value)}
                disabled={loading}
                className={fieldErrors.job ? 'border-destructive' : ''}
              />
              {fieldErrors.job && <p className="text-xs text-destructive">{fieldErrors.job}</p>}
              {isLinkedInUser && !job && (
                <p className="text-xs text-muted-foreground">
                  Please enter your job title to help personalize your articles
                </p>
              )}
            </div> */}
          </CardContent>
        </Card>

        {/* Password Card - Only show for non-LinkedIn users */}
        {!isLinkedInUser && (
          <Card className="border-2 pt-0 pb-6">
            <CardHeader className="py-4 bg-purple-500/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-500" />
                Set Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    className={`pr-10 ${fieldErrors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className={`pr-10 ${fieldErrors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ready message */}
      {isValid && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold">Ready to go!</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive articles on {frequency.length} day
                {frequency.length !== 1 ? 's' : ''} in {selectedLanguage?.label}. After creating
                your account, you'll choose a subscription plan to activate your personalized
                articles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={handleBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          size="lg"
          className={isValid ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {isLinkedInUser ? 'Saving Profile...' : 'Creating Account...'}
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              {isLinkedInUser ? 'Continue & Choose Plan' : 'Create Account & Choose Plan'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function GenerateStep3Page() {
  return (
    <Suspense fallback={<Step3LoadingSkeleton />}>
      <GenerateStep3Content />
    </Suspense>
  );
}
