'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { MetricCard } from '@/components/metric-card';
import { StyleCard } from '@/components/articles/style-card';
import { Win95Window, Win95Button, Win95Alert } from '@/components/win95';
import { apiClient } from '@/lib/api-client';
import { FileText, Mail, Sparkles } from 'lucide-react';
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
              {/* Payment Success Banner */}
              {showPaymentSuccess && (
                <Win95Alert
                  type="success"
                  title="🎉 Payment Successful!"
                  onClose={dismissPaymentSuccess}
                >
                  Welcome to Drafter Pro! Your subscription is now active. Start creating amazing
                  content today.
                </Win95Alert>
              )}

              {/* Welcome Section */}
              <div className="win95-sunken p-3">
                <h2 className="text-[14px] font-bold mb-1">Welcome back, {firstName}! 👋</h2>
                <p className="text-[11px] text-[var(--win95-button-shadow)]">
                  Here's an overview of your article generation system
                </p>
              </div>

              {/* Metrics Grid */}
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

              {/* Article Style Section */}
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

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
              <DashboardHeader />
              <Win95Window title="Dashboard" icon={<span>📊</span>}>
                <div className="text-center py-8">
                  <span className="text-[11px] win95-loading">Loading...</span>
                </div>
              </Win95Window>
            </div>
          </div>
        </ProtectedRoute>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
