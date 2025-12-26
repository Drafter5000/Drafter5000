'use client';

import { useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Win95Alert, Win95Button } from '@/components/win95';
import { AlertCircle, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { formatExpirationDate } from '@/lib/subscription-utils';

export type BannerType = 'expired' | 'limit_reached';

export interface ExpirationBannerProps {
  expirationDate?: Date | null;
  onRenewClick: () => void;
  isRenewing: boolean;
  status?: 'past_due' | 'canceled' | 'incomplete';
  /** Type of banner - 'expired' for subscription expiration, 'limit_reached' for usage limit */
  type?: BannerType;
  /** Usage data for limit_reached type */
  usageData?: {
    articles_used: number;
    articles_limit: number;
  };
}

export function SubscriptionExpirationBanner({
  expirationDate,
  onRenewClick,
  isRenewing,
  status = 'canceled',
  type = 'expired',
  usageData,
}: ExpirationBannerProps) {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  const dateStr = expirationDate ? formatExpirationDate(expirationDate) : null;

  // Determine title, message, and button text based on type and status
  let title: string;
  let message: string;
  let buttonText: string;
  let variant: 'error' | 'warning' = 'error';

  if (type === 'limit_reached') {
    title = 'Monthly Limit Reached';
    message = usageData
      ? `You've used ${usageData.articles_used} of ${usageData.articles_limit} articles this month. Upgrade your plan for more articles.`
      : "You've reached your monthly article limit. Upgrade your plan for more articles.";
    buttonText = 'Upgrade Plan';
    variant = 'error';
  } else if (status === 'past_due') {
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
    buttonText = 'Renew Subscription';
  }

  // Win95 Design
  if (designMode === 'win95') {
    const isLimitReached = type === 'limit_reached';
    const isExpired = type === 'expired';
    const showUrgentStyling = isExpired || isLimitReached;
    return (
      <div className={`mb-4 ${showUrgentStyling ? 'animate-pulse' : ''}`}>
        <Win95Alert type="error">
          <div className="flex items-start justify-between gap-4 bg-red-100 border-2 border-red-600 p-2 -m-1">
            <div className="flex items-start gap-2">
              <span className="text-[16px] animate-bounce">{isLimitReached ? '🚫' : '🚨'}</span>
              <div>
                <p className="text-[12px] font-bold text-red-700">
                  {isLimitReached ? '🚫 ' : '⚠️ '}
                  {title}
                </p>
                <p className="text-[11px] mt-1 text-red-600">{message}</p>
              </div>
            </div>
            <Win95Button
              onClick={onRenewClick}
              disabled={isRenewing}
              className="shrink-0 bg-red-600 text-white"
            >
              {isRenewing ? 'Loading...' : isLimitReached ? `📈 ${buttonText}` : `🔄 ${buttonText}`}
            </Win95Button>
          </div>
        </Win95Alert>
      </div>
    );
  }

  // Modern Design
  const isLimitReached = type === 'limit_reached';
  const isExpired = type === 'expired';
  const showUrgentStyling = isExpired || isLimitReached;

  return (
    <Alert
      variant="destructive"
      className={`mb-6 border-red-500 bg-red-50 dark:bg-red-950/50 shadow-lg shadow-red-500/20 ring-1 ring-red-500/30 ${
        showUrgentStyling ? 'animate-pulse' : ''
      }`}
    >
      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500 animate-pulse" />
      <div className="flex flex-1 items-start justify-between gap-4">
        <div>
          <AlertTitle className="font-bold text-base text-red-700 dark:text-red-400">
            {isLimitReached ? '🚫 ' : '⚠️ '}
            {title}
          </AlertTitle>
          <AlertDescription className="mt-1 text-red-600 dark:text-red-300">
            {message}
          </AlertDescription>
        </div>
        <Button
          onClick={onRenewClick}
          disabled={isRenewing}
          className="shrink-0 bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
          size="sm"
          variant="destructive"
        >
          {isRenewing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              {isLimitReached ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {buttonText}
            </>
          )}
        </Button>
      </div>
    </Alert>
  );
}
