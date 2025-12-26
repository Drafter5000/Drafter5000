'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';

interface LinkedInLoginButtonProps {
  disabled?: boolean;
  className?: string;
}

// LinkedIn official brand icon
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function LinkedInLoginButton({ disabled, className }: LinkedInLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLinkedInLogin = async () => {
    setLoading(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('LinkedIn login error:', error.message);
        setLoading(false);
      }
      // If successful, the page will redirect to LinkedIn
    } catch (err) {
      console.error('LinkedIn login error:', err);
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLinkedInLogin}
      disabled={isDisabled}
      className={cn(
        'w-full h-12 gap-3 border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all duration-300',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Connecting to LinkedIn...
        </>
      ) : (
        <>
          <LinkedInIcon className="h-5 w-5" />
          Continue with LinkedIn
        </>
      )}
    </Button>
  );
}
