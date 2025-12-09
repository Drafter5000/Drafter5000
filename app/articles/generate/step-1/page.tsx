'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StyleFormStep1 } from '@/components/articles/style-form-step1';
import { DraftSessionService } from '@/lib/draft-session';
import { isStyleSampleValid } from '@/lib/onboarding-validation';
import { Loader2, FileText } from 'lucide-react';

/**
 * Step 1 - Writing Style (Anonymous Access)
 * Requirements: 1.2, 2.1, 2.3, 2.4
 */
export default function GenerateStep1Page() {
  const router = useRouter();
  const [initialArticles, setInitialArticles] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load existing data from DraftSessionService
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
      // Validate at least one sample
      const validArticles = articles.filter(a => a.trim());
      if (!isStyleSampleValid(validArticles)) {
        setError('Please add at least one article sample');
        setLoading(false);
        return;
      }

      // Save to DraftSessionService
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Define Your Writing Style</h2>
          <p className="text-muted-foreground mt-2">
            Share up to 3 articles so our AI can learn your unique voice
          </p>
        </div>
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
