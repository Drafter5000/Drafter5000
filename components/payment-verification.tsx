'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  CreditCard,
  Sparkles,
  Database,
  Rocket,
} from 'lucide-react';

interface VerificationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  icon: React.ReactNode;
}

interface PaymentVerificationProps {
  sessionId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

const INITIAL_STEPS: VerificationStep[] = [
  {
    id: 'verify',
    label: 'Verifying Payment',
    status: 'pending',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: 'activate',
    label: 'Activating Your Style',
    status: 'pending',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'sync',
    label: 'Syncing Your Data',
    status: 'pending',
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: 'complete',
    label: 'Setup Complete',
    status: 'pending',
    icon: <Rocket className="h-5 w-5" />,
  },
];

export function PaymentVerification({ sessionId, onComplete, onError }: PaymentVerificationProps) {
  const [steps, setSteps] = useState<VerificationStep[]>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const updateStepStatus = useCallback((stepId: string, status: VerificationStep['status']) => {
    setSteps(prev => prev.map(step => (step.id === stepId ? { ...step, status } : step)));
  }, []);

  const runVerification = useCallback(async () => {
    console.log('[PaymentVerification] Starting verification flow...');
    console.log('[PaymentVerification] Session ID:', sessionId);

    try {
      // Step 1: Verify payment
      console.log('[PaymentVerification] Step 1: Verifying payment...');
      updateStepStatus('verify', 'in-progress');

      let verifyResult;
      try {
        verifyResult = await apiClient.post<{ success: boolean; status: string; plan: string }>(
          '/stripe/verify-session',
          { session_id: sessionId }
        );
        console.log('[PaymentVerification] Verify result:', verifyResult);
      } catch (verifyError) {
        console.error('[PaymentVerification] Verify session API error:', verifyError);
        throw new Error(
          verifyError instanceof Error ? verifyError.message : 'Payment verification failed'
        );
      }

      if (!verifyResult.success) {
        throw new Error('Payment verification failed - session not successful');
      }
      updateStepStatus('verify', 'complete');
      console.log('[PaymentVerification] Step 1 complete');

      // Step 2: Activate style
      console.log('[PaymentVerification] Step 2: Activating style...');
      updateStepStatus('activate', 'in-progress');

      let activateResult;
      try {
        activateResult = await apiClient.post<{
          success: boolean;
          style: unknown;
          sheetsSync: { success: boolean; error?: string } | null;
          message: string;
        }>('/stripe/activate-style', {});
        console.log('[PaymentVerification] Activate result:', activateResult);
        console.log('[PaymentVerification] Sheets sync result:', activateResult.sheetsSync);
      } catch (activateError) {
        console.error('[PaymentVerification] Activate style API error:', activateError);
        throw new Error(
          activateError instanceof Error ? activateError.message : 'Style activation failed'
        );
      }

      if (!activateResult.success) {
        throw new Error('Style activation failed');
      }

      // Log sheets sync status
      if (activateResult.sheetsSync) {
        if (activateResult.sheetsSync.success) {
          console.log('[PaymentVerification] Google Sheets sync successful');
        } else {
          console.warn(
            '[PaymentVerification] Google Sheets sync failed:',
            activateResult.sheetsSync.error
          );
        }
      }

      updateStepStatus('activate', 'complete');
      console.log('[PaymentVerification] Step 2 complete');

      // Step 3: Sync complete (already done in activate-style)
      console.log('[PaymentVerification] Step 3: Sync display...');
      updateStepStatus('sync', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      updateStepStatus('sync', 'complete');
      console.log('[PaymentVerification] Step 3 complete');

      // Step 4: Complete
      console.log('[PaymentVerification] Step 4: Completing...');
      updateStepStatus('complete', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStepStatus('complete', 'complete');
      console.log('[PaymentVerification] Step 4 complete');

      console.log('[PaymentVerification] All steps complete, starting countdown...');
      setIsComplete(true);
      setCountdown(3);
    } catch (err) {
      console.error('[PaymentVerification] Verification flow error:', err);
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      onError?.(message);
    }
  }, [sessionId, updateStepStatus, onError]);

  // Use ref to prevent duplicate verification runs
  const verificationStartedRef = React.useRef(false);

  useEffect(() => {
    if (verificationStartedRef.current) return;
    verificationStartedRef.current = true;
    runVerification();
  }, [runVerification]);

  // Countdown and redirect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      onComplete?.();
      // Use full page redirect to ensure middleware properly evaluates auth state
      // router.replace() does client-side navigation which can cause race conditions
      window.location.href = '/dashboard?payment_success=true';
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  const handleRetry = () => {
    setError(null);
    setSteps(INITIAL_STEPS);
    verificationStartedRef.current = false;
    runVerification();
  };

  const handleGoToDashboard = () => {
    // Use full page redirect to ensure middleware properly evaluates auth state
    window.location.href = '/dashboard?payment_success=true';
  };

  const getStepIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'in-progress':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="max-w-md w-full border-2 shadow-xl">
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-8">
            {isComplete ? (
              <>
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're All Set! 🎉</h2>
                <p className="text-muted-foreground">
                  Your account is ready. Redirecting in {countdown}...
                </p>
              </>
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Setting Up Your Account</h2>
                <p className="text-muted-foreground">
                  Please wait while we activate your subscription...
                </p>
              </>
            )}
          </div>

          <div className="space-y-4">
            {steps.map(step => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                  step.status === 'complete'
                    ? 'bg-green-500/10'
                    : step.status === 'in-progress'
                      ? 'bg-primary/10'
                      : 'bg-muted/50'
                }`}
              >
                <div className="shrink-0">{getStepIcon(step)}</div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      step.status === 'complete'
                        ? 'text-green-600'
                        : step.status === 'in-progress'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                <div className="shrink-0 text-muted-foreground">{step.icon}</div>
              </div>
            ))}
          </div>

          {isComplete && (
            <div className="mt-6 text-center">
              <Button onClick={handleGoToDashboard} className="gap-2">
                <Rocket className="h-4 w-4" />
                Go to Dashboard Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
