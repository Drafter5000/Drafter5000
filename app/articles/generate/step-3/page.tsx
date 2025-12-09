'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  StyleFormStep3Signup,
  SignupFormData,
} from '@/components/articles/style-form-step3-signup';
import { DraftSessionService } from '@/lib/draft-session';
import { apiClient } from '@/lib/api-client';
import { Loader2, Rocket, AlertCircle, Mail, CheckCircle2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Step 3 - Signup + Payment (Anonymous Access)
 * Requirements: 4.1, 4.2, 4.3, 4.4, 8.3
 */
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

  // Check for cancelled payment
  const wasCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    // Load draft data from DraftSessionService
    const draftSession = DraftSessionService.load();

    // Redirect to step 1 if no draft data exists
    if (!draftSession?.style_samples || draftSession.style_samples.length === 0) {
      router.push('/articles/generate/step-1');
      return;
    }

    // Redirect to step 2 if no subjects exist
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

  // Get email provider URL based on email domain
  const getEmailProviderUrl = () => {
    const domain = userEmail.split('@')[1]?.toLowerCase();
    if (!domain) return 'https://mail.google.com';

    if (domain.includes('gmail')) return 'https://mail.google.com';
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live'))
      return 'https://outlook.live.com';
    if (domain.includes('yahoo')) return 'https://mail.yahoo.com';
    if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com'))
      return 'https://www.icloud.com/mail';
    if (domain.includes('proton')) return 'https://mail.proton.me';

    return 'https://mail.google.com';
  };

  const handleSubmit = async (formData: SignupFormData) => {
    if (!draftData) {
      setError('Please complete steps 1 and 2 first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call signup-with-style API
      const response = await apiClient.post<{ user_id: string; checkout_url: string }>(
        '/auth/signup-with-style',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          job: formData.job,
          style_samples: draftData.style_samples,
          subjects: draftData.subjects,
          preferred_language: formData.preferred_language,
          delivery_days: formData.delivery_days,
        }
      );

      // Clear draft session on successful signup
      DraftSessionService.clear();

      // Store email for verification screen
      setUserEmail(formData.email);
      setSignupComplete(true);

      // Redirect to Stripe checkout
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Email Verification Screen (shown if checkout URL fails)
  if (signupComplete && !loading) {
    return (
      <div className="space-y-8">
        <Card className="max-w-md mx-auto border border-gray-200 shadow-xl bg-white">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 mb-2 mx-auto shadow-xl shadow-amber-500/30">
              <Mail className="h-10 w-10 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Verify Your Email
              </h2>
              <p className="text-gray-500">We've sent a verification link to</p>
              <p className="font-semibold text-gray-900">{userEmail}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Please verify your email to:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Log in to your account</li>
                    <li>Access all features</li>
                    <li>Start receiving your articles</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={getEmailProviderUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full h-12 text-base gap-2 shadow-lg shadow-primary/25">
                  Open Email
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>

              <Link href="/login">
                <Button variant="outline" className="w-full h-12 text-base">
                  Go to Login
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 pt-2">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {wasCancelled && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payment was cancelled. Please try again to complete your signup.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10">
          <Rocket className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <p className="text-muted-foreground mt-2">
            Sign up and complete payment to start receiving your personalized articles
          </p>
        </div>
      </div>

      <StyleFormStep3Signup
        onSubmit={handleSubmit}
        onBack={handleBack}
        loading={loading}
        error={error}
      />
    </div>
  );
}
