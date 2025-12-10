'use client';

import { useEffect, useState, Suspense, useContext } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { MetricCard } from '@/components/metric-card';
import { StyleCard } from '@/components/articles/style-card';
import { Win95Window, Win95Button, Win95Alert } from '@/components/win95';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { FileText, Mail, Sparkles, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ArticleStyle } from '@/lib/types';

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

function DashboardContent() {
  const { user } = useAuth();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [styleLoading, setStyleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('payment_success') === 'true') {
      setShowPaymentSuccess(true);
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

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
        setStyle(stylesData.length > 0 ? stylesData[0] : null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
        setStyleLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const dismissPaymentSuccess = () => {
    setShowPaymentSuccess(false);
  };

  const handleDeleteStyle = async (id: string) => {
    if (!user) return;
    await apiClient.delete(`/article-styles/${id}?user_id=${user.id}`);
    setStyle(null);
  };

  // Win95 Design
  if (designMode === 'win95') {
    if (loading) {
      return (
        <ProtectedRoute>
          <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
              <DashboardHeader />
              <Win95Window title="Dashboard" icon={<span>📊</span>}>
                <div className="text-center py-8">
                  <span className="text-[11px] win95-loading">Loading dashboard...</span>
                </div>
              </Win95Window>
            </div>
          </div>
        </ProtectedRoute>
      );
    }

    if (error || !data) {
      return (
        <ProtectedRoute>
          <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
              <DashboardHeader />
              <Win95Window title="Dashboard - Error" icon={<span>❌</span>}>
                <Win95Alert type="error" title="Error">
                  {error || 'Failed to load dashboard'}
                </Win95Alert>
              </Win95Window>
            </div>
          </div>
        </ProtectedRoute>
      );
    }

    const firstName = data.profile.display_name?.split(' ')[0] || 'there';

    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4">
          <div className="max-w-6xl mx-auto">
            <DashboardHeader />

            <Win95Window title="Dashboard" icon={<span>📊</span>}>
              <div className="space-y-4">
                {showPaymentSuccess && (
                  <Win95Alert
                    type="success"
                    title="🎉 Payment Successful!"
                    onClose={dismissPaymentSuccess}
                  >
                    Welcome to Drafter Pro! Your subscription is now active.
                  </Win95Alert>
                )}

                <div className="win95-sunken p-3">
                  <h2 className="text-[14px] font-bold mb-1">Welcome back, {firstName}! 👋</h2>
                  <p className="text-[11px] text-[var(--win95-button-shadow)]">
                    Here's an overview of your article generation system
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
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
                </div>

                <div className="win95-sunken p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[14px]">📄</span>
                    <span className="text-[11px] font-bold">Your Article Style</span>
                  </div>

                  {styleLoading ? (
                    <div className="text-center py-4">
                      <span className="text-[11px] win95-loading">Loading style...</span>
                    </div>
                  ) : style ? (
                    <div className="max-w-[300px]">
                      <StyleCard style={style} onDelete={handleDeleteStyle} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-[32px] mb-2">📄</div>
                      <h3 className="text-[12px] font-bold mb-1">No Article Style Yet</h3>
                      <p className="text-[10px] text-[var(--win95-button-shadow)] mb-4">
                        Create your article style to start generating personalized content.
                      </p>
                      <Link href="/articles/generate/step-1">
                        <Win95Button>+ Create Your Style</Win95Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Win95Window>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Modern Design
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="pt-10 pb-20 px-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <Skeleton className="h-10 w-80 mb-2" />
                <Skeleton className="h-6 w-96" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-2">
                    <CardContent className="pt-6">
                      <Skeleton className="h-4 w-32 mb-4" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-28" />
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            {showPaymentSuccess && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎉</span>
                  <div>
                    <p className="font-semibold">Payment Successful!</p>
                    <p className="text-sm">
                      Welcome to Drafter Pro! Your subscription is now active.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={dismissPaymentSuccess}>
                  Dismiss
                </Button>
              </div>
            )}

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {firstName}! 👋</h2>
              <p className="text-muted-foreground text-lg">
                Here's an overview of your article generation system
              </p>
            </div>

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
                value={style ? 1 : 0}
                description="Active writing styles"
                icon={FileText}
              />
            </div>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Your Article Style
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
                {styleLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(1)].map((_, i) => (
                      <Card key={i} className="border">
                        <CardContent className="pt-6">
                          <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : style ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StyleCard style={style} onDelete={handleDeleteStyle} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">No Article Style Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
              <DashboardHeader />
              <div className="text-center py-8">Loading...</div>
            </div>
          </div>
        </ProtectedRoute>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
