'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export type DesignMode = 'win95' | 'modern';

export interface DesignContextType {
  designMode: DesignMode;
  setDesignMode: (mode: DesignMode) => void;
  toggleDesign: () => void;
  toggleAndReload: () => void;
}

export const DesignContext = createContext<DesignContextType | null>(null);

const STORAGE_KEY = 'design-mode';

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [designMode, setDesignModeState] = useState<DesignMode>('modern');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as DesignMode | null;
    if (stored && (stored === 'win95' || stored === 'modern')) {
      setDesignModeState(stored);
    }
    // If no stored value, keep default 'modern'
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (designMode === 'modern') {
      root.classList.add('modern-design');
      root.classList.remove('win95-design');
    } else {
      root.classList.add('win95-design');
      root.classList.remove('modern-design');
    }
    localStorage.setItem(STORAGE_KEY, designMode);
  }, [designMode, mounted]);

  const setDesignMode = (mode: DesignMode) => {
    setDesignModeState(mode);
  };

  const toggleDesign = () => {
    setDesignModeState(prev => (prev === 'win95' ? 'modern' : 'win95'));
  };

  // Toggle and reload the page to apply styles fully
  const toggleAndReload = () => {
    const newMode = designMode === 'win95' ? 'modern' : 'win95';
    localStorage.setItem(STORAGE_KEY, newMode);
    window.location.reload();
  };

  // Prevent flash of wrong design
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DesignContext.Provider value={{ designMode, setDesignMode, toggleDesign, toggleAndReload }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (context === null) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
}
