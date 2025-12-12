/**
 * Hook for managing subscription status state
 * Requirements: 1.1, 2.1, 5.4
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  type SubscriptionStatus,
  type SubscriptionData,
  type SubscriptionState,
  getSubscriptionState,
  isSubscriptionExpired,
} from '@/lib/subscription-utils';

export interface UseSubscriptionStatusReturn {
  status: SubscriptionStatus;
  isExpired: boolean;
  isLoading: boolean;
  error: string | null;
  expirationDate: Date | null;
  canAccessFeatures: boolean;
  message: string;
  plan: string;
  refetch: () => Promise<void>;
}

export function useSubscriptionStatus(): UseSubscriptionStatusReturn {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.get<SubscriptionData>('/stripe/subscription');
      setSubscriptionData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch subscription status';
      setError(errorMessage);
      console.error('Subscription status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // Compute subscription state from data
  const state: SubscriptionState = subscriptionData
    ? getSubscriptionState(
        { subscription_status: subscriptionData.status as SubscriptionStatus },
        subscriptionData
      )
    : {
        status: 'incomplete',
        isExpired: false,
        expirationDate: null,
        canAccessFeatures: false,
        message: '',
      };

  return {
    status: state.status,
    isExpired: state.isExpired,
    isLoading,
    error,
    expirationDate: state.expirationDate,
    canAccessFeatures: state.canAccessFeatures,
    message: state.message,
    plan: subscriptionData?.plan || 'free',
    refetch: fetchSubscriptionStatus,
  };
}
