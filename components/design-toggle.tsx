'use client';

import { useContext } from 'react';
import { DesignContext, type DesignContextType } from './design-provider';
import { Monitor, Palette } from 'lucide-react';

interface DesignToggleProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export function DesignToggle({ variant = 'inline', className = '' }: DesignToggleProps) {
  const context = useContext<DesignContextType | null>(DesignContext);

  // Don't render until context is available
  if (!context) {
    return null;
  }

  const { designMode, toggleAndReload } = context;

  // Inline variant for headers
  if (variant === 'inline') {
    if (designMode === 'win95') {
      return (
        <button
          onClick={toggleAndReload}
          className={`win95-btn h-[22px] flex items-center gap-1 px-2 text-[11px] ${className}`}
          title="Switch to Modern Design"
        >
          <Palette className="h-3 w-3" />
          <span>Modern</span>
        </button>
      );
    }

    return (
      <button
        onClick={toggleAndReload}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border bg-background hover:bg-accent transition-colors ${className}`}
        title="Switch to Win95 Design"
      >
        <Monitor className="h-4 w-4" />
        <span>Win95</span>
      </button>
    );
  }

  // Floating variant (fixed position)
  return (
    <button
      onClick={toggleAndReload}
      className={`
        fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all
        ${
          designMode === 'win95'
            ? 'win95-btn'
            : 'rounded-lg bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
        }
        ${className}
      `}
      title={`Switch to ${designMode === 'win95' ? 'Modern' : 'Win95'} design`}
    >
      {designMode === 'win95' ? (
        <>
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Modern</span>
        </>
      ) : (
        <>
          <Monitor className="h-4 w-4" />
          <span className="hidden sm:inline">Win95</span>
        </>
      )}
    </button>
  );
}
