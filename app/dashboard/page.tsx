'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { MetricCard } from '@/components/metric-card';
import { StyleCard } from '@/components/articles/style-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import {
  FileText,
  Sparkles,
  Mail,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  PartyPopper,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [styleLoading, setStyleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Check for payment success query param
  useEffect(() => {
    if (searchParams.get('payment_success') === 'true') {
      setShowPaymentSuccess(true);
      // Remove the query param from URL without reload
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
        // Only use the first style (single style per user)
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
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

              {/* Article Style Section Skeleton */}
              <Card className="border-2">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
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
            {/* Payment Success Banner */}
            {showPaymentSuccess && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 p-4 sm:p-6">
                <button
                  onClick={dismissPaymentSuccess}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-green-500/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 text-green-600" />
                </button>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-green-700">Payment Successful!</h3>
                      <PartyPopper className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-sm text-green-600/80">
                      Welcome to Drafter Pro! Your subscription is now active. Start creating
                      amazing content today.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Section */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {firstName}! 👋</h2>
              <p className="text-muted-foreground text-lg">
                Here's an overview of your article generation system
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Article Style Section */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Your Article Style
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {styleLoading ? (
                  <Card className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-24 mb-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : style ? (
                  <div className="max-w-md">
                    <StyleCard style={style} onDelete={handleDeleteStyle} />
                  </div>
                ) : (
                  <div className="text-center py-12">
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Main page component with Suspense boundary for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="pt-10 pb-20 px-6">
              <div className="max-w-7xl mx-auto space-y-8">
                <div>
                  <Skeleton className="h-10 w-80 mb-2" />
                  <Skeleton className="h-6 w-96" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
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
              </div>
            </main>
          </div>
        </ProtectedRoute>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
