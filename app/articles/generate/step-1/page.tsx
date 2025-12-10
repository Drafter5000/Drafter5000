'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { StyleFormStep1 } from '@/components/articles/style-form-step1';
import { DraftSessionService } from '@/lib/draft-session';
import { isStyleSampleValid } from '@/lib/onboarding-validation';
import { FileText } from 'lucide-react';

/**
 * Step 1 - Writing Style (Anonymous Access)
 * Requirements: 1.2, 2.1, 2.3, 2.4
 */
export default function GenerateStep1Page() {
  const router = useRouter();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const [initialArticles, setInitialArticles] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      router.push('/articles/generate/step-2');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save articles';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <span
          className={designMode === 'win95' ? 'text-[11px] win95-loading' : 'text-muted-foreground'}
        >
          Loading...
        </span>
      </div>
    );
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
