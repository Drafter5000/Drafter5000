'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { StyleFormStep2 } from '@/components/articles/style-form-step2';
import { apiClient } from '@/lib/api-client';
import { Loader2, Lightbulb } from 'lucide-react';

export default function GenerateStep2Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [initialSubjects, setInitialSubjects] = useState<string[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;

      // Get draft_id from session storage or API
      const storedDraftId = sessionStorage.getItem('article_style_draft_id');

      try {
        const data = await apiClient.get<{ subjects: string[]; draft_id: string | null }>(
          `/article-styles/step-2?user_id=${user.id}`
        );
        if (data.subjects?.length > 0) {
          setInitialSubjects(data.subjects);
        }
        setDraftId(storedDraftId || data.draft_id);
      } catch {
        setDraftId(storedDraftId);
      } finally {
        setInitialLoading(false);
      }
    };
    loadExistingData();
  }, [user]);

  const handleSubmit = async (subjects: string[]) => {
    if (!user) return;

    if (!draftId) {
      setError('Please complete step 1 first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/article-styles/step-2', {
        user_id: user.id,
        subjects,
        draft_id: draftId,
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
        userId={user?.id}
      />
    </div>
  );
}
