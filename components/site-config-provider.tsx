'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSiteConfig, type SiteConfig, getDefaultSiteConfig } from '@/hooks/use-site-config';

interface SiteConfigContextValue {
  config: SiteConfig;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  siteName: string;
  logoUrl: string;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

interface SiteConfigProviderProps {
  children: ReactNode;
}

export function SiteConfigProvider({ children }: SiteConfigProviderProps) {
  const siteConfig = useSiteConfig();

  return <SiteConfigContext.Provider value={siteConfig}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfigContext(): SiteConfigContextValue {
  const context = useContext(SiteConfigContext);
  if (!context) {
    // Return default values if used outside provider
    const defaultConfig = getDefaultSiteConfig();
    return {
      config: defaultConfig,
      loading: false,
      error: null,
      refresh: () => {},
      siteName: defaultConfig.siteName,
      logoUrl: defaultConfig.logoUrl,
    };
  }
  return context;
}
