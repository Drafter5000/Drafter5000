'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { StyleFormStep1 } from '@/components/articles/style-form-step1';
import { apiClient } from '@/lib/api-client';
import { Loader2, FileText } from 'lucide-react';

export default function GenerateStep1Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [initialArticles, setInitialArticles] = useState<string[]>(['', '', '']);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<{ style_samples: string[]; draft_id: string | null }>(
          `/article-styles/step-1?user_id=${user.id}`
        );
        if (data.style_samples?.length > 0) {
          setInitialArticles([...data.style_samples, '', '', ''].slice(0, 3));
        }
        if (data.draft_id) {
          setDraftId(data.draft_id);
        }
      } catch {
        // No existing data
      } finally {
        setInitialLoading(false);
      }
    };
    loadExistingData();
  }, [user]);

  const handleSubmit = async (articles: string[]) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ draft_id: string }>('/article-styles/step-1', {
        user_id: user.id,
        style_samples: articles,
        draft_id: draftId,
      });

      // Store draft_id for next steps
      if (response.draft_id) {
        sessionStorage.setItem('article_style_draft_id', response.draft_id);
      }

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
