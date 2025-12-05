'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { StyleList } from '@/components/articles/style-list';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';

export default function ArticleStylesPage() {
  const { user } = useAuth();
  const [styles, setStyles] = useState<ArticleStyle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStyles = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle[]>(`/article-styles?user_id=${user.id}`);
        setStyles(data);
      } catch (err) {
        console.error('Failed to fetch styles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStyles();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    await apiClient.delete(`/article-styles/${id}?user_id=${user.id}`);
    setStyles(styles.filter(s => s.id !== id));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Article Styles</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your writing styles and preferences
                  </p>
                </div>
              </div>
              <Link href="/articles/generate/step-1">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Style
                </Button>
              </Link>
            </div>

            <StyleList styles={styles} loading={loading} onDelete={handleDelete} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
