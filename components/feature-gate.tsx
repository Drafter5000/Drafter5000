/**
 * Feature Gate Component
 * Wraps features and conditionally disables them based on subscription status
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

'use client';

import { useState, useCallback, useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RenewalModal } from '@/components/renewal-modal';
import { useSubscriptionStatus } from '@/lib/hooks/use-subscription-status';
import { getDisabledFeatureTooltip } from '@/lib/subscription-utils';
import { apiClient } from '@/lib/api-client';

export interface FeatureGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
  /** If true, clicking on disabled content will show renewal modal */
  showModalOnClick?: boolean;
}

export function FeatureGate({
  children,
  fallback,
  showTooltip = true,
  tooltipMessage,
  showModalOnClick = true,
}: FeatureGateProps) {
  const { isExpired, canAccessFeatures, isLoading } = useSubscriptionStatus();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  const handleRenewClick = useCallback(async () => {
    try {
      setIsRenewing(true);
      const { url } = await apiClient.post<{ url: string }>('/stripe/portal', {});
      window.location.href = url;
    } catch (error) {
      console.error('Portal redirect error:', error);
      setIsRenewing(false);
    }
  }, []);

  const handleDisabledClick = useCallback(() => {
    if (showModalOnClick) {
      setShowRenewalModal(true);
    }
  }, [showModalOnClick]);

  // While loading, show children normally (fail open)
  if (isLoading) {
    return <>{children}</>;
  }

  // If subscription is active, render children normally
  if (canAccessFeatures && !isExpired) {
    return <>{children}</>;
  }

  // Subscription is expired - show disabled state
  const tooltip = tooltipMessage || getDisabledFeatureTooltip();

  const disabledContent = (
    <div
      className="relative cursor-not-allowed"
      onClick={handleDisabledClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleDisabledClick();
        }
      }}
    >
      {/* Overlay to show disabled state */}
      <div className="pointer-events-none opacity-50 grayscale select-none">
        {fallback || children}
      </div>
      {/* Invisible overlay to capture clicks */}
      <div className="absolute inset-0" />
    </div>
  );

  // Win95 design - simpler tooltip approach
  if (designMode === 'win95') {
    return (
      <>
        <div title={tooltip}>{disabledContent}</div>
        <RenewalModal
          isOpen={showRenewalModal}
          onClose={() => setShowRenewalModal(false)}
          onRenew={handleRenewClick}
          isLoading={isRenewing}
        />
      </>
    );
  }

  // Modern design with tooltip
  if (showTooltip) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>{disabledContent}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
        <RenewalModal
          isOpen={showRenewalModal}
          onClose={() => setShowRenewalModal(false)}
          onRenew={handleRenewClick}
          isLoading={isRenewing}
        />
      </>
    );
  }

  return (
    <>
      {disabledContent}
      <RenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onRenew={handleRenewClick}
        isLoading={isRenewing}
      />
    </>
  );
}
