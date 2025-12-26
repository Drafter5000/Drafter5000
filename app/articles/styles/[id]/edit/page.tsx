'use client';

import { useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Edit Style Page - Redirects to step-1
 * The edit flow uses the same step-based approach as the create flow
 * Preserves the returnTo query parameter for proper navigation after editing
 */
export default function EditStylePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to step 1 of the edit flow, preserving returnTo param
    const returnTo = searchParams.get('returnTo');
    const redirectUrl = `/articles/styles/${id}/edit/step-1${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
    router.replace(redirectUrl);
  }, [id, router, searchParams]);

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
