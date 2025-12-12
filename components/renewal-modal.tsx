/**
 * Renewal Modal Component
 * Displays a modal prompting subscription renewal when user attempts to access disabled features
 * Requirements: 2.5, 3.1, 4.4
 */

'use client';

import { useContext } from 'react';
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
import { AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';

export interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew: () => void;
  isLoading: boolean;
}

export function RenewalModal({ isOpen, onClose, onRenew, isLoading }: RenewalModalProps) {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  // Win95 Design
  if (designMode === 'win95') {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-50">
          <Win95Window title="Subscription Required" icon={<span>⚠️</span>}>
            <div className="p-4 min-w-[300px]">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-[24px]">⚠️</span>
                <div>
                  <p className="text-[12px] font-bold mb-2">Subscription Required</p>
                  <p className="text-[11px]">
                    Your subscription has expired. Please renew your subscription to access this
                    feature.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Win95Button onClick={onClose} disabled={isLoading}>
                  Cancel
                </Win95Button>
                <Win95Button onClick={onRenew} disabled={isLoading}>
                  {isLoading ? 'Loading...' : '🔄 Renew Subscription'}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Subscription Required</DialogTitle>
              <DialogDescription className="mt-1">Your subscription has expired</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Your subscription has expired. Please renew your subscription to access this feature and
            continue generating articles.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onRenew} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Renew Subscription
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
