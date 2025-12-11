'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { StyleFormStep2 } from '@/components/articles/style-form-step2';
import { DraftSessionService } from '@/lib/draft-session';
import { isSubjectListValid } from '@/lib/onboarding-validation';
import { Lightbulb } from 'lucide-react';

/**
 * Step 2 - Topics (Anonymous Access)
 * Requirements: 3.1, 3.3, 3.4
 */
export default function GenerateStep2Page() {
  const router = useRouter();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const [initialSubjects, setInitialSubjects] = useState<string[]>([]);
  const [styleSamples, setStyleSamples] = useState<string[]>([]);
  const [job, setJob] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draftSession = DraftSessionService.load();

    if (!draftSession?.style_samples || draftSession.style_samples.length === 0) {
      router.push('/articles/generate/step-1');
      return;
    }

    // Store style samples for AI suggestions
    setStyleSamples(draftSession.style_samples);

    // Store job for AI suggestions
    if (draftSession?.job) {
      setJob(draftSession.job);
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
      if (!isSubjectListValid(subjects)) {
        setError('Please add at least one topic');
        setLoading(false);
        return;
      }

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
          <div className="text-[32px] mb-2">💡</div>
          <h2 className="text-[14px] font-bold">Choose Your Topics</h2>
          <p className="text-[11px] text-[var(--win95-button-shadow)]">
            Add subjects you want to write about. Each topic becomes one article.
          </p>
        </div>

        <StyleFormStep2
          initialSubjects={initialSubjects}
          onSubmit={handleSubmit}
          onBack={handleBack}
          loading={loading}
          error={error}
          styleSamples={styleSamples}
          job={job}
        />
      </div>
    );
  }

  // Modern Design
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Topics</h2>
        <p className="text-muted-foreground">
          Add subjects you want to write about. Each topic becomes one article.
        </p>
      </div>

      <StyleFormStep2
        initialSubjects={initialSubjects}
        onSubmit={handleSubmit}
        onBack={handleBack}
        loading={loading}
        error={error}
        styleSamples={styleSamples}
        job={job}
      />
    </div>
  );
}
