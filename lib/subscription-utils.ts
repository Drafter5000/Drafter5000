/**
 * Subscription utility functions for handling subscription expiration and renewal
 */

import type { UserProfile } from './types';

// Subscription status types
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

// Subscription state interface
export interface SubscriptionState {
  status: SubscriptionStatus;
  isExpired: boolean;
  expirationDate: Date | null;
  canAccessFeatures: boolean;
  message: string;
}

// Subscription data from API
export interface SubscriptionData {
  plan: string;
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number;
  is_expired?: boolean;
  expiration_date?: string;
}

/**
 * Checks if a subscription status indicates an expired subscription.
 * Returns true for 'past_due' and 'canceled' statuses.
 */
export function isSubscriptionExpired(status: SubscriptionStatus | string): boolean {
  return status === 'past_due' || status === 'canceled';
}

/**
 * Computes the full subscription state from user profile and subscription data.
 */
export function getSubscriptionState(
  profile: Pick<UserProfile, 'subscription_status'> | null,
  subscription?: SubscriptionData | null
): SubscriptionState {
  const status = (profile?.subscription_status ||
    subscription?.status ||
    'incomplete') as SubscriptionStatus;
  const isExpired = isSubscriptionExpired(status);

  // Determine expiration date
  let expirationDate: Date | null = null;
  if (subscription?.current_period_end) {
    expirationDate = new Date(subscription.current_period_end * 1000);
  } else if (subscription?.expiration_date) {
    expirationDate = new Date(subscription.expiration_date);
  }

  // Can access features only if subscription is active or trialing
  const canAccessFeatures = status === 'active' || status === 'trialing';

  // Generate appropriate message
  const message = getExpirationMessage({
    status,
    isExpired,
    expirationDate,
    canAccessFeatures,
  });

  return {
    status,
    isExpired,
    expirationDate,
    canAccessFeatures,
    message,
  };
}

/**
 * Generates a user-facing message based on subscription state.
 */
export function getExpirationMessage(state: Omit<SubscriptionState, 'message'>): string {
  if (!state.isExpired) {
    return '';
  }

  const dateStr = state.expirationDate ? formatExpirationDate(state.expirationDate) : '';

  if (state.status === 'canceled') {
    return dateStr
      ? `Your subscription was canceled on ${dateStr}. Please renew to continue using the service.`
      : 'Your subscription has been canceled. Please renew to continue using the service.';
  }

  if (state.status === 'past_due') {
    return dateStr
      ? `Your subscription payment failed on ${dateStr}. Please update your payment method to continue using the service.`
      : 'Your subscription payment has failed. Please update your payment method to continue using the service.';
  }

  return 'Your subscription has expired. Please renew to continue using the service.';
}

/**
 * Formats an expiration date for display.
 */
export function formatExpirationDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Gets the tooltip message for disabled features.
 * Requirements: 2.4
 */
export function getDisabledFeatureTooltip(): string {
  return 'Subscription required to access this feature';
}

/**
 * Checks if a user can access premium features based on their subscription.
 */
export function canAccessPremiumFeatures(status: SubscriptionStatus | string): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Result of subscription access check for API routes
 */
export interface SubscriptionAccessResult {
  hasAccess: boolean;
  status: SubscriptionStatus | string;
  message: string;
}

/**
 * Checks if a user has an active subscription and can access features.
 * Used by API routes to enforce subscription requirements.
 * Returns an object with access status and appropriate error message.
 */
export function checkSubscriptionAccess(
  subscriptionStatus: SubscriptionStatus | string | null | undefined
): SubscriptionAccessResult {
  const status = subscriptionStatus || 'incomplete';
  const hasAccess = canAccessPremiumFeatures(status);

  let message = '';
  if (!hasAccess) {
    if (status === 'canceled') {
      message = 'Your subscription has been canceled. Please renew to continue using this feature.';
    } else if (status === 'past_due') {
      message =
        'Your subscription payment has failed. Please update your payment method to continue.';
    } else if (status === 'incomplete') {
      message = 'Please complete your subscription to access this feature.';
    } else {
      message = 'An active subscription is required to access this feature.';
    }
  }

  return { hasAccess, status, message };
}
