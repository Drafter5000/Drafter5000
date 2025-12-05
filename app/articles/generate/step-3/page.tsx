'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { StyleFormStep3 } from '@/components/articles/style-form-step3';
import { apiClient } from '@/lib/api-client';
import { Loader2, Rocket } from 'lucide-react';

interface Step3Response {
  name: string;
  email: string;
  display_name: string;
  preferred_language: string;
  delivery_days: string[];
  draft_id: string | null;
}

export default function GenerateStep3Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<Partial<Step3Response>>({});
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;

      const storedDraftId = sessionStorage.getItem('article_style_draft_id');

      try {
        const data = await apiClient.get<Step3Response>(
          `/article-styles/step-3?user_id=${user.id}`
        );
        setInitialData(data);
        setDraftId(storedDraftId || data.draft_id);
      } catch {
        setDraftId(storedDraftId);
      } finally {
        setInitialLoading(false);
      }
    };
    loadExistingData();
  }, [user]);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    display_name: string;
    preferred_language: string;
    delivery_days: string[];
  }) => {
    if (!user) return;

    if (!draftId) {
      setError('Please complete steps 1 and 2 first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/article-styles/step-3', {
        user_id: user.id,
        draft_id: draftId,
        ...data,
      });

      // Clear draft from session storage
      sessionStorage.removeItem('article_style_draft_id');

      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete setup';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/articles/generate/step-2');
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
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10">
          <Rocket className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Final Step - Delivery Settings</h2>
          <p className="text-muted-foreground mt-2">
            Configure how and when you'll receive your personalized articles
          </p>
        </div>
      </div>

      <StyleFormStep3
        initialData={initialData}
        userEmail={user?.email || ''}
        onSubmit={handleSubmit}
        onBack={handleBack}
        loading={loading}
        error={error}
      />
    </div>
  );
}
