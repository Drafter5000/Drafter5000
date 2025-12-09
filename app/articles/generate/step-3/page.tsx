'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Win95Window,
  Win95Button,
  Win95Input,
  Win95Select,
  Win95Checkbox,
  Win95Alert,
  Win95Badge,
} from '@/components/win95';
import { DraftSessionService } from '@/lib/draft-session';
import { apiClient } from '@/lib/api-client';
import { validateSignupForm } from '@/lib/onboarding-validation';
import {
  toggleDay as toggleDayUtil,
  toggleAllDays,
  areAllDaysSelected,
  DayCode,
} from '@/lib/day-selection';
import Link from 'next/link';

const DAYS = [
  { id: 'mon' as DayCode, label: 'Monday', short: 'Mon' },
  { id: 'tue' as DayCode, label: 'Tuesday', short: 'Tue' },
  { id: 'wed' as DayCode, label: 'Wednesday', short: 'Wed' },
  { id: 'thu' as DayCode, label: 'Thursday', short: 'Thu' },
  { id: 'fri' as DayCode, label: 'Friday', short: 'Fri' },
  { id: 'sat' as DayCode, label: 'Saturday', short: 'Sat' },
  { id: 'sun' as DayCode, label: 'Sunday', short: 'Sun' },
];

const LANGUAGES = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'de', label: '🇩🇪 German' },
  { value: 'it', label: '🇮🇹 Italian' },
  { value: 'pt', label: '🇵🇹 Portuguese' },
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'zh', label: '🇨🇳 Chinese' },
  { value: 'ko', label: '🇰🇷 Korean' },
];

export default function GenerateStep3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');
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

  const wasCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    // Don't redirect if signup is already complete (showing email verification)
    if (signupComplete) {
      setInitialLoading(false);
      return;
    }

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
  }, [router, signupComplete]);

  const handleToggleDay = (dayId: DayCode) => {
    setFrequency(prev => toggleDayUtil(prev, dayId));
  };

  const isEveryday = areAllDaysSelected(frequency);

  const handleToggleEveryday = () => {
    setFrequency(prev => toggleAllDays(prev));
  };

  const validation = validateSignupForm({ name, email, password, confirmPassword, job });
  const isValid = validation.valid && frequency.length > 0;

  const getEmailProviderUrl = () => {
    const domain = userEmail.split('@')[1]?.toLowerCase();
    if (!domain) return 'https://mail.google.com';
    if (domain.includes('gmail')) return 'https://mail.google.com';
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live'))
      return 'https://outlook.live.com';
    if (domain.includes('yahoo')) return 'https://mail.yahoo.com';
    return 'https://mail.google.com';
  };

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

    try {
      const response = await apiClient.post<{ user_id: string; checkout_url: string }>(
        '/auth/signup-with-style',
        {
          name,
          email,
          password,
          confirmPassword,
          job,
          style_samples: draftData.style_samples,
          subjects: draftData.subjects,
          preferred_language: language,
          delivery_days: frequency,
        }
      );

      DraftSessionService.clear();
      setUserEmail(email);
      setSignupComplete(true);

      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/articles/generate/step-2');
  };

  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <span className="text-[11px] win95-loading">Loading...</span>
      </div>
    );
  }

  if (signupComplete && !loading) {
    return (
      <div className="text-center py-4">
        <div className="text-[48px] mb-2">📧</div>
        <h2 className="text-[14px] font-bold mb-2">Verify Your Email</h2>
        <p className="text-[11px] mb-1">We've sent a verification link to</p>
        <p className="text-[11px] font-bold mb-4">{userEmail}</p>

        <div className="win95-sunken p-3 text-left mb-4 max-w-[300px] mx-auto">
          <p className="text-[11px] font-bold mb-1">✓ Please verify your email to:</p>
          <ul className="text-[10px] ml-4 list-disc">
            <li>Log in to your account</li>
            <li>Access all features</li>
            <li>Start receiving your articles</li>
          </ul>
        </div>

        <div className="space-y-2 max-w-[200px] mx-auto">
          <a href={getEmailProviderUrl()} target="_blank" rel="noopener noreferrer">
            <Win95Button size="lg" className="w-full">
              Open Email
            </Win95Button>
          </a>
          <Link href="/login">
            <Win95Button size="lg" className="w-full">
              Go to Login
            </Win95Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-[32px] mb-2">🚀</div>
        <h2 className="text-[14px] font-bold">Create Your Account</h2>
        <p className="text-[11px] text-[var(--win95-button-shadow)]">
          Sign up and complete payment to start receiving your personalized articles
        </p>
      </div>

      {wasCancelled && (
        <Win95Alert type="warning" title="Payment Cancelled">
          Payment was cancelled. Please try again to complete your signup.
        </Win95Alert>
      )}

      {error && (
        <Win95Alert type="error" title="Error">
          {error}
        </Win95Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Account Information */}
        <div className="win95-sunken p-3">
          <div className="text-[11px] font-bold mb-3">👤 Account Information</div>
          <div className="space-y-3">
            <Win95Input
              label="Full Name *"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
              error={fieldErrors.name}
            />
            <Win95Input
              label="Email Address *"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              error={fieldErrors.email}
            />
            <Win95Input
              label="Job Title *"
              placeholder="Marketing Manager"
              value={job}
              onChange={e => setJob(e.target.value)}
              disabled={loading}
              error={fieldErrors.job}
            />
          </div>
        </div>

        {/* Password */}
        <div className="win95-sunken p-3">
          <div className="text-[11px] font-bold mb-3">🔒 Set Password</div>
          <div className="space-y-3">
            <Win95Input
              label="Password *"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              error={fieldErrors.password}
            />
            <p className="text-[10px] text-[var(--win95-button-shadow)] -mt-2">
              Minimum 8 characters
            </p>
            <Win95Input
              label="Confirm Password *"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={fieldErrors.confirmPassword}
            />
          </div>
        </div>

        {/* Delivery Days */}
        <div className="win95-sunken p-3">
          <div className="text-[11px] font-bold mb-3">📅 Delivery Days</div>
          <div className="space-y-2">
            <Win95Checkbox
              checked={isEveryday}
              onCheckedChange={handleToggleEveryday}
              label="Every Day"
              disabled={loading}
            />
            <div className="grid grid-cols-2 gap-1">
              {DAYS.map(day => (
                <Win95Checkbox
                  key={day.id}
                  checked={frequency.includes(day.id)}
                  onCheckedChange={() => handleToggleDay(day.id)}
                  label={day.short}
                  disabled={loading}
                />
              ))}
            </div>
            {frequency.length > 0 && (
              <p className="text-[10px] text-[var(--win95-success)]">
                ✓ {frequency.length} day{frequency.length !== 1 ? 's' : ''} selected
              </p>
            )}
            {fieldErrors.delivery_days && (
              <p className="text-[10px] text-[var(--win95-error)]">{fieldErrors.delivery_days}</p>
            )}
          </div>
        </div>

        {/* Language */}
        <div className="win95-sunken p-3">
          <div className="text-[11px] font-bold mb-3">🌐 Article Language</div>
          <Win95Select
            value={language}
            onValueChange={setLanguage}
            options={LANGUAGES}
            disabled={loading}
          />
          <div className="win95-raised p-2 mt-3 text-center">
            <span className="text-[20px]">
              {LANGUAGES.find(l => l.value === language)?.label.split(' ')[0]}
            </span>
            <p className="text-[10px]">
              Articles in{' '}
              {LANGUAGES.find(l => l.value === language)
                ?.label.split(' ')
                .slice(1)
                .join(' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Ready message */}
      {isValid && (
        <Win95Alert type="success" title="Ready to go!">
          You'll receive articles on {frequency.length} day{frequency.length !== 1 ? 's' : ''} in{' '}
          {LANGUAGES.find(l => l.value === language)
            ?.label.split(' ')
            .slice(1)
            .join(' ')}
          . After payment, your personalized articles will start arriving.
        </Win95Alert>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--win95-button-shadow)]">
        <Win95Button onClick={handleBack} disabled={loading}>
          ← Back
        </Win95Button>

        <Win95Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          size="lg"
          className={loading ? 'win95-loading' : ''}
        >
          {loading ? 'Creating Account...' : '🚀 Create Account & Pay'}
        </Win95Button>
      </div>
    </div>
  );
}
