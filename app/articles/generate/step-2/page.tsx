'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StyleFormStep2 } from '@/components/articles/style-form-step2';
import { DraftSessionService } from '@/lib/draft-session';
import { isSubjectListValid } from '@/lib/onboarding-validation';
import { Loader2, Lightbulb } from 'lucide-react';

/**
 * Step 2 - Topics (Anonymous Access)
 * Requirements: 3.1, 3.3, 3.4
 */
export default function GenerateStep2Page() {
  const router = useRouter();
  const [initialSubjects, setInitialSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load existing data from DraftSessionService
    const draftSession = DraftSessionService.load();

    // Redirect to step 1 if no style samples exist
    if (!draftSession?.style_samples || draftSession.style_samples.length === 0) {
      router.push('/articles/generate/step-1');
      return;
    }

    if (draftSession?.subjects && draftSession.subjects.length > 0) {
      setInitialSubjects(draftSession.subjects);
    }
    setInitialLoading(false);
  }, [router]);

  const handleSubmit = async (subjects: string[]) => {
    setLoading(true);
    setError(null);

    try {
      // Validate at least one subject
      if (!isSubjectListValid(subjects)) {
        setError('Please add at least one topic');
        setLoading(false);
        return;
      }

      // Save to DraftSessionService
      DraftSessionService.save({
        subjects,
        current_step: 3,
      });

      router.push('/articles/generate/step-3');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save subjects';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/articles/generate/step-1');
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
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/10">
          <Lightbulb className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Choose Your Topics</h2>
          <p className="text-muted-foreground mt-2">
            Add subjects you want to write about. Each topic becomes one article.
          </p>
        </div>
      </div>

      <StyleFormStep2
        initialSubjects={initialSubjects}
        onSubmit={handleSubmit}
        onBack={handleBack}
        loading={loading}
        error={error}
      />
    </div>
  );
}
