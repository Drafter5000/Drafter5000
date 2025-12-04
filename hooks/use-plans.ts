'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

interface UsePlansResult {
  plans: SubscriptionPlanWithFeatures[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching subscription plans from the API.
 * Handles loading, error states, and caching.
 */
export function usePlans(): UsePlansResult {
  const [plans, setPlans] = useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ plans: SubscriptionPlanWithFeatures[] }>(
        '/stripe/plans'
      );
      setPlans(response.plans);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(message);
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
}
