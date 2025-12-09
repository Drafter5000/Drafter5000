'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { StyleCard } from '@/components/articles/style-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';

export default function ArticleStylesPage() {
  const { user } = useAuth();
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStyles = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle[]>(`/article-styles?user_id=${user.id}`);
        // Only use the first style (single style per user)
        setStyle(data.length > 0 ? data[0] : null);
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
    setStyle(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Your Article Style</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your writing style and preferences
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <Card className="border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-3" />
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : style ? (
              <div className="max-w-md">
                <StyleCard style={style} onDelete={handleDelete} />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Article Style Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your article style to start generating personalized content.
                </p>
                <Link href="/articles/generate/step-1">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your Style
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
