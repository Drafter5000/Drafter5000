import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, APIError } from '@/lib/api-client';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface DashboardMetrics {
  articles_generated: number;
  articles_sent: number;
  draft_articles: number;
  trends: {
    articles_generated: TrendData | null;
    articles_sent: TrendData | null;
    draft_articles: TrendData | null;
  };
}

interface DashboardData {
  profile: { display_name: string | null; email: string };
  metrics: DashboardMetrics;
}

interface UseDashboardStatsOptions {
  userId: string | undefined;
  cacheKey?: string;
  cacheTTL?: number; // in milliseconds
}

interface UseDashboardStatsReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  refetch: () => Promise<void>;
  syncStats: () => Promise<void>;
}

const CACHE_PREFIX = 'drafter_dashboard_';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

function getFromCache<T>(key: string, ttl: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    const parsed: CachedData<T> = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > ttl) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setToCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const cached: CachedData<T> = { data, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Custom hook for fetching dashboard stats with caching
 * Prevents unnecessary re-renders and API calls
 */
export function useDashboardStats({
  userId,
  cacheKey = 'stats',
  cacheTTL = DEFAULT_CACHE_TTL,
}: UseDashboardStatsOptions): UseDashboardStatsReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Refs to prevent duplicate calls
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!userId || fetchingRef.current) return;

    fetchingRef.current = true;

    try {
      // Check cache first
      const cached = getFromCache<DashboardData>(`${cacheKey}_${userId}`, cacheTTL);
      if (cached && mountedRef.current) {
        setData(cached);
        setLoading(false);
      }

      // Fetch fresh data
      const dashboardData = await apiClient.get<DashboardData>(
        `/dashboard/metrics?user_id=${userId}`
      );

      if (mountedRef.current) {
        setData(dashboardData);
        setToCache(`${cacheKey}_${userId}`, dashboardData);
        setError(null);
      }
    } catch (err: unknown) {
      if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
        // Auth error, redirect will happen
        return;
      }
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [userId, cacheKey, cacheTTL]);

  const syncStats = useCallback(async () => {
    if (!userId || syncing) return;

    setSyncing(true);
    try {
      await apiClient.post('/stats/sync', {});
      // Refetch after sync
      await fetchData();
    } catch (err) {
      console.error('Failed to sync stats:', err);
    } finally {
      if (mountedRef.current) {
        setSyncing(false);
      }
    }
  }, [userId, syncing, fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Also trigger background sync
    apiClient.get('/stats/sync?max_age=5').catch(() => null);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    syncing,
    refetch: fetchData,
    syncStats,
  };
}
