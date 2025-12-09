'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Win95Window } from '@/components/win95';

/**
 * Signup page - redirects to the Get Started flow
 * The signup process is now integrated into step-3 of the onboarding flow
 */
export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // Already logged in, go to dashboard
        router.push('/dashboard');
      } else {
        // Redirect to Get Started flow
        router.push('/articles/generate/step-1');
      }
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Win95Window title="Redirecting..." showControls={false}>
        <div className="p-4 text-center text-[11px]">
          <span className="win95-loading">Redirecting to Get Started...</span>
        </div>
      </Win95Window>
    </div>
  );
}
