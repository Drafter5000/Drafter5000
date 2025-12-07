'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationWithRole } from '@/lib/types';

interface UseOrgSwitcherOptions {
  onSuccess?: (orgId: string) => void;
  onError?: (error: string) => void;
}

export function useOrgSwitcher(options: UseOrgSwitcherOptions = {}) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      setSwitching(true);
      setError(null);

      try {
        const response = await fetch('/api/user/switch-org', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organization_id: organizationId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to switch organization');
        }

        options.onSuccess?.(organizationId);

        // Refresh the page to reload data with new organization context
        router.refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to switch organization';
        setError(errorMessage);
        options.onError?.(errorMessage);
      } finally {
        setSwitching(false);
      }
    },
    [router, options]
  );

  return {
    switchOrganization,
    switching,
    error,
  };
}
