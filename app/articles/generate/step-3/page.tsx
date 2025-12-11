'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  User,
  Globe,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Mail,
  Sparkles,
  Lock,
  Briefcase,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DraftSessionService } from '@/lib/draft-session';
import { apiClient } from '@/lib/api-client';
import { validateSignupForm } from '@/lib/onboarding-validation';
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection';
import { LANGUAGES, DAYS } from '@/lib/constants';

interface SignupResponse {
  success: boolean;
  user_id?: string;
  redirect_url?: string;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
  retry?: boolean;
}

export default function GenerateStep3Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);
  const [draftData, setDraftData] = useState<{
    style_samples: string[];
    subjects: string[];
  } | null>(null);

  // Form state
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
    const draftSession = DraftSessionService.load();

    if (!draftSession?.style_samples || draftSession.style_samples.length === 0) {
      router.push('/articles/generate/step-1');
      return;
    }

    if (!draftSession?.subjects || draftSession.subjects.length === 0) {
      router.push('/articles/generate/step-2');
      return;
    }

    setDraftData({
      style_samples: draftSession.style_samples,
      subjects: draftSession.subjects,
    });
    setInitialLoading(false);
  }, [router]);

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId));
  };

  const isEveryday = areAllDaysSelected(frequency);

  const handleToggleEveryday = () => {
    setFrequency(prev => toggleAllDays(prev));
  };

  const validation = validateSignupForm({ name, email, password, confirmPassword, job });
  const isValid = validation.valid && frequency.length > 0;
  const selectedLanguage = LANGUAGES.find(l => l.code === language);

  const handleSubmit = async () => {
    if (!draftData) {
      setError('Please complete steps 1 and 2 first');
      return;
    }

    const result = validateSignupForm({ name, email, password, confirmPassword, job });
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
      const response = await apiClient.post<SignupResponse>('/auth/signup-with-style', {
        name,
        email,
        password,
        confirmPassword,
        job,
        style_samples: draftData.style_samples,
        subjects: draftData.subjects,
        preferred_language: language,
        delivery_days: frequency,
      });

      if (response.success) {
        // Clear draft data on successful signup
        DraftSessionService.clear();

        // Use full page redirect to ensure auth cookies are properly read
        // router.push() does client-side navigation which doesn't refresh auth state
        window.location.href = '/subscribe';
      } else {
        // Handle error response
        setError(response.error || 'Failed to create account');
        setCanRetry(response.retry !== false);
        if (response.fields) {
          setFieldErrors(response.fields);
        }
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to create account. Please try again.';
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
    router.push('/articles/generate/step-2');
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <p className="text-muted-foreground mt-2">
            Final step! Sign up to choose your plan and start receiving articles
          </p>
        </div>
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
        {/* Account Information Card */}
        <Card className="border-2 pt-0 pb-6">
          <CardHeader className="py-4 bg-blue-500/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                className={fieldErrors.name ? 'border-destructive' : ''}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className={fieldErrors.email ? 'border-destructive' : ''}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job" className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Job Title <span className="text-destructive">*</span>
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
              <p className="text-xs text-muted-foreground">
                The AI will draft articles as if it was doing this job
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Password Card */}
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
              Creating Account...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Create Account & Choose Plan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
