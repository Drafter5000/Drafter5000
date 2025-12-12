/**
 * Subscription Expiration Banner Component
 * Displays a prominent banner when subscription is expired with renewal CTA
 * Requirements: 1.1, 1.3, 4.1
 */

'use client';

import { useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Win95Alert, Win95Button } from '@/components/win95';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { formatExpirationDate } from '@/lib/subscription-utils';

export interface ExpirationBannerProps {
  expirationDate: Date | null;
  onRenewClick: () => void;
  isRenewing: boolean;
  status?: 'past_due' | 'canceled' | 'incomplete';
}

export function SubscriptionExpirationBanner({
  expirationDate,
  onRenewClick,
  isRenewing,
  status = 'canceled',
}: ExpirationBannerProps) {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  const dateStr = expirationDate ? formatExpirationDate(expirationDate) : null;

  // Determine title, message, and button text based on status
  let title: string;
  let message: string;
  let buttonText: string;

  if (status === 'past_due') {
    title = 'Payment Failed';
    message = dateStr
      ? `Your subscription payment failed on ${dateStr}. Please update your payment method to continue using the service.`
      : 'Your subscription payment has failed. Please update your payment method to continue using the service.';
    buttonText = 'Update Payment';
  } else if (status === 'incomplete') {
    title = 'Subscription Required';
    message = 'Please complete your subscription to access all features.';
    buttonText = 'Subscribe Now';
  } else {
    // canceled or default
    title = 'Subscription Expired';
    message = dateStr
      ? `Your subscription expired on ${dateStr}. Please renew to continue using the service.`
      : 'Your subscription has expired. Please renew to continue using the service.';
    buttonText = 'Renew Now';
  }

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="mb-4">
        <Win95Alert type="error">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <span className="text-[16px]">⚠️</span>
              <div>
                <p className="text-[12px] font-bold">{title}</p>
                <p className="text-[11px] mt-1">{message}</p>
              </div>
            </div>
            <Win95Button onClick={onRenewClick} disabled={isRenewing} className="shrink-0">
              {isRenewing ? 'Loading...' : `🔄 ${buttonText}`}
            </Win95Button>
          </div>
        </Win95Alert>
      </div>
    );
  }

  // Modern Design
  return (
    <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/10">
      <AlertCircle className="h-5 w-5" />
      <div className="flex flex-1 items-start justify-between gap-4">
        <div>
          <AlertTitle className="text-destructive font-semibold">{title}</AlertTitle>
          <AlertDescription className="text-destructive/90 mt-1">{message}</AlertDescription>
        </div>
        <Button onClick={onRenewClick} disabled={isRenewing} className="shrink-0" size="sm">
          {isRenewing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      </div>
    </Alert>
  );
}
