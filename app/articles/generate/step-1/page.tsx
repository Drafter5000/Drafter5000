'use client';

import { useState, useEffect, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { StyleFormStep1 } from '@/components/articles/style-form-step1';
import { DraftSessionService } from '@/lib/draft-session';
import { isStyleSampleValid } from '@/lib/onboarding-validation';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';

function LoadingSkeleton({ designMode }: { designMode: DesignMode }) {
  if (designMode === 'win95') {
    return (
      <div className="text-center py-8">
        <span className="text-[11px] win95-loading">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2" style={{ opacity: 1 - (i - 1) * 0.2 }}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
    </div>
  );
}

function GenerateStep1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const [initialArticles, setInitialArticles] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preserve provider parameter for LinkedIn users
  const providerParam = searchParams.get('provider') === 'linkedin' ? '?provider=linkedin' : '';

  useEffect(() => {
    const draftSession = DraftSessionService.load();
    if (draftSession?.style_samples && draftSession.style_samples.length > 0) {
      setInitialArticles([...draftSession.style_samples, '', '', ''].slice(0, 3));
    }
    setInitialLoading(false);
  }, []);

  const handleSubmit = async (articles: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const validArticles = articles.filter(a => a.trim());
      if (!isStyleSampleValid(articles)) {
        setError('Please add all 3 article samples to continue');
        setLoading(false);
        return;
      }

      DraftSessionService.save({
        style_samples: validArticles,
        current_step: 2,
      });

      router.push(`/articles/generate/step-2${providerParam}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save articles';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSkeleton designMode={designMode} />;
  }

  // Win95 Design
  if (designMode === 'win95') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-[32px] mb-2">📝</div>
          <h2 className="text-[14px] font-bold">Define Your Writing Style</h2>
          <p className="text-[11px] text-[var(--win95-button-shadow)]">
            Share 3 articles so our AI can learn your unique voice
          </p>
        </div>

        <StyleFormStep1
          initialArticles={initialArticles}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>
    );
  }

  // Modern Design
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Define Your Writing Style</h2>
        <p className="text-muted-foreground">
          Share 3 articles so our AI can learn your unique voice
        </p>
      </div>

      <StyleFormStep1
        initialArticles={initialArticles}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </div>
  );
}

/**
 * Step 1 - Writing Style (Anonymous Access)
 */
export default function GenerateStep1Page() {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  return (
    <Suspense fallback={<LoadingSkeleton designMode={designMode} />}>
      <GenerateStep1Content />
    </Suspense>
  );
}
