/**
 * Usage Limit Modal Component
 * Displays a one-time modal when user reaches their monthly article generation limit
 * Uses localStorage to track if the modal has been shown for the current billing period
 */

'use client';

import { useContext, useEffect, useState } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Win95Window, Win95Button } from '@/components/win95';
import { AlertTriangle, Loader2, Zap, TrendingUp } from 'lucide-react';

export interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  isLoading?: boolean;
  articlesUsed: number;
  articlesLimit: number;
}

const STORAGE_KEY = 'usage_limit_modal_shown';

/**
 * Get the current billing period key (YYYY-MM format)
 * Used to reset the "shown" state each billing cycle
 */
function getCurrentBillingPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check if the modal has already been shown this billing period
 */
export function hasModalBeenShown(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  return stored === getCurrentBillingPeriod();
}

/**
 * Mark the modal as shown for this billing period
 */
export function markModalAsShown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, getCurrentBillingPeriod());
}

export function UsageLimitModal({
  isOpen,
  onClose,
  onUpgrade,
  isLoading = false,
  articlesUsed,
  articlesLimit,
}: UsageLimitModalProps) {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  // Mark as shown when modal opens
  useEffect(() => {
    if (isOpen) {
      markModalAsShown();
    }
  }, [isOpen]);

  // Win95 Design
  if (designMode === 'win95') {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-50">
          <Win95Window title="Monthly Limit Reached" icon={<span>📊</span>}>
            <div className="p-4 min-w-[320px]">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-[24px]">⚠️</span>
                <div>
                  <p className="text-[12px] font-bold mb-2">Monthly Limit Reached</p>
                  <p className="text-[11px] mb-2">
                    You've used all {articlesLimit} articles included in your plan this month.
                  </p>
                  <div className="win95-sunken p-2 mb-2">
                    <p className="text-[11px]">
                      📈 Usage: {articlesUsed}/{articlesLimit} articles
                    </p>
                  </div>
                  <p className="text-[11px]">
                    Upgrade your plan to generate more articles or wait until next month.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Win95Button onClick={onClose} disabled={isLoading}>
                  Maybe Later
                </Win95Button>
                <Win95Button onClick={onUpgrade} disabled={isLoading}>
                  {isLoading ? 'Loading...' : '⬆️ Upgrade Plan'}
                </Win95Button>
              </div>
            </div>
          </Win95Window>
        </div>
      </div>
    );
  }

  // Modern Design
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Monthly Limit Reached</DialogTitle>
              <DialogDescription className="mt-1">
                You've reached your article generation limit
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Usage Progress */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Articles Generated</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {articlesUsed}/{articlesLimit}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            You've used all {articlesLimit} articles included in your current plan this month.
            Upgrade to a higher tier to continue generating content, or wait until your limit resets
            next month.
          </p>

          {/* Benefits hint */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
            <span>Higher plans include more articles and priority support.</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Maybe Later
          </Button>
          <Button onClick={onUpgrade} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Upgrade Plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
