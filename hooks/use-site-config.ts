'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  updatedAt: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'Drafter5000',
  logoUrl: '/logo/logo.png',
  updatedAt: '',
};

const CACHE_KEY = 'site_config';
const CACHE_TIMESTAMP_KEY = 'site_config_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getFromCache(): SiteConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setToCache(config: SiteConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Ignore cache errors
  }
}

function shouldRefreshCache(cachedConfig: SiteConfig | null, newConfig: SiteConfig): boolean {
  if (!cachedConfig) return true;
  return cachedConfig.updatedAt !== newConfig.updatedAt;
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getFromCache();
        if (cached) {
          setConfig(cached);
          setLoading(false);
          // Still fetch in background to check for updates
          fetchInBackground(cached);
          return;
        }
      }

      const response = await fetch('/api/config/site');
      if (!response.ok) {
        throw new Error('Failed to fetch site config');
      }

      const data: SiteConfig = await response.json();
      setConfig(data);
      setToCache(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching site config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load site config');
      // Use cached or default on error
      const cached = getFromCache();
      if (cached) {
        setConfig(cached);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInBackground = async (cachedConfig: SiteConfig) => {
    try {
      const response = await fetch('/api/config/site');
      if (!response.ok) return;

      const data: SiteConfig = await response.json();

      // Only update if config has changed
      if (shouldRefreshCache(cachedConfig, data)) {
        setConfig(data);
        setToCache(data);
      }
    } catch {
      // Silently fail background refresh
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchConfig(true);
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    refresh,
    siteName: config.siteName,
    logoUrl: config.logoUrl,
  };
}

// Export a simple getter for SSR/initial render
export function getDefaultSiteConfig(): SiteConfig {
  return DEFAULT_CONFIG;
}
