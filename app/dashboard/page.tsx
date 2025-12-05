'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { MetricCard } from '@/components/metric-card';
import { StyleList } from '@/components/articles/style-list';
import { ArticleList } from '@/components/articles/article-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { FileText, Sparkles, Mail, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { ArticleStyle, ArticleWithStyle } from '@/lib/types';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface DashboardData {
  profile: {
    display_name: string | null;
    email: string;
  };
  metrics: {
    articles_generated: number;
    articles_sent: number;
    draft_articles: number;
    trends: {
      articles_generated: TrendData | null;
      articles_sent: TrendData | null;
      draft_articles: TrendData | null;
    };
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [styles, setStyles] = useState<ArticleStyle[]>([]);
  const [articles, setArticles] = useState<ArticleWithStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [dashboardData, stylesData] = await Promise.all([
          apiClient.get<DashboardData>(`/dashboard/metrics?user_id=${user.id}`),
          apiClient.get<ArticleStyle[]>(`/article-styles?user_id=${user.id}`),
        ]);
        setData(dashboardData);
        setStyles(stylesData.slice(0, 6)); // Show max 6 styles

        // Mock articles for now - would come from API
        setArticles([]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
        setStylesLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteStyle = async (id: string) => {
    if (!user) return;
    await apiClient.delete(`/article-styles/${id}?user_id=${user.id}`);
    setStyles(styles.filter(s => s.id !== id));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="pt-10 pb-20 px-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Welcome Section Skeleton */}
              <div>
                <Skeleton className="h-10 w-80 mb-2" />
                <Skeleton className="h-6 w-96" />
              </div>

              {/* Metrics Grid Skeleton */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-28" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Article Styles Section Skeleton */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="border">
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="pt-24 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{error || 'Failed to load dashboard'}</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const firstName = data.profile.display_name?.split(' ')[0] || 'there';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <main className="pt-10 pb-20 px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {firstName}! 👋</h2>
              <p className="text-muted-foreground text-lg">
                Here's an overview of your article generation system
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Articles Generated"
                value={data.metrics.articles_generated}
                description="Total articles created"
                icon={FileText}
                trend={data.metrics.trends.articles_generated ?? undefined}
              />
              <MetricCard
                title="Articles Sent"
                value={data.metrics.articles_sent}
                description="Delivered to your email"
                icon={Mail}
                trend={data.metrics.trends.articles_sent ?? undefined}
              />
              <MetricCard
                title="In Draft"
                value={data.metrics.draft_articles}
                description="Waiting for review"
                icon={Sparkles}
                trend={data.metrics.trends.draft_articles ?? undefined}
              />
              <MetricCard
                title="Article Styles"
                value={styles.length}
                description="Active writing styles"
                icon={FileText}
              />
            </div>

            {/* Article Styles Section */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Recent Article Styles
                  </CardTitle>
                  <div className="flex gap-2">
                    <Link href="/articles/styles">
                      <Button variant="ghost" size="sm" className="gap-2">
                        View All <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/articles/generate/step-1">
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Style
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StyleList styles={styles} loading={stylesLoading} onDelete={handleDeleteStyle} />
              </CardContent>
            </Card>

            {/* My Articles Section */}
            {/* <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    My Articles
                  </CardTitle>
                  <Link href="/articles">
                    <Button variant="ghost" size="sm" className="gap-2">
                      View All <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ArticleList
                  articles={articles}
                  loading={false}
                />
              </CardContent>
            </Card> */}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
