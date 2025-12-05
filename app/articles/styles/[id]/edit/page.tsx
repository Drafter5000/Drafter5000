'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { StyleFormStep1 } from '@/components/articles/style-form-step1';
import { StyleFormStep2 } from '@/components/articles/style-form-step2';
import { StyleFormStep3 } from '@/components/articles/style-form-step3';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Loader2, FileText, Lightbulb, Settings } from 'lucide-react';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';

export default function EditStylePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('samples');

  useEffect(() => {
    const fetchStyle = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle>(`/article-styles/${id}?user_id=${user.id}`);
        setStyle(data);
      } catch (err) {
        console.error('Failed to fetch style:', err);
        router.push('/articles/styles');
      } finally {
        setLoading(false);
      }
    };
    fetchStyle();
  }, [user, id, router]);

  const handleUpdateSamples = async (samples: string[]) => {
    if (!user || !style) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiClient.put<ArticleStyle>(`/article-styles/${id}`, {
        user_id: user.id,
        style_samples: samples,
      });
      setStyle(updated);
      setActiveTab('subjects');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubjects = async (subjects: string[]) => {
    if (!user || !style) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiClient.put<ArticleStyle>(`/article-styles/${id}`, {
        user_id: user.id,
        subjects,
      });
      setStyle(updated);
      setActiveTab('settings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async (data: {
    name: string;
    email: string;
    display_name: string;
    preferred_language: string;
    delivery_days: string[];
  }) => {
    if (!user || !style) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.put(`/article-styles/${id}`, {
        user_id: user.id,
        ...data,
      });
      router.push(`/articles/styles/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!style) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link href={`/articles/styles/${id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold">Edit Style: {style.name}</h1>
              <p className="text-muted-foreground">Update your article style settings</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="samples" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Samples
                </TabsTrigger>
                <TabsTrigger value="subjects" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Topics
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="samples">
                <StyleFormStep1
                  initialArticles={style.style_samples}
                  onSubmit={handleUpdateSamples}
                  loading={saving}
                  error={error}
                />
              </TabsContent>

              <TabsContent value="subjects">
                <StyleFormStep2
                  initialSubjects={style.subjects}
                  onSubmit={handleUpdateSubjects}
                  onBack={() => setActiveTab('samples')}
                  loading={saving}
                  error={error}
                />
              </TabsContent>

              <TabsContent value="settings">
                <StyleFormStep3
                  initialData={{
                    name: style.name,
                    email: style.email || '',
                    display_name: style.display_name || '',
                    preferred_language: style.preferred_language,
                    delivery_days: style.delivery_days,
                  }}
                  userEmail={user?.email || ''}
                  onSubmit={handleUpdateSettings}
                  onBack={() => setActiveTab('subjects')}
                  loading={saving}
                  error={error}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
