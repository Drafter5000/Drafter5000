'use client';

import React, { useEffect, useState, Suspense, useContext, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { MetricCard } from '@/components/metric-card';
import { Win95Window, Win95Button, Win95Alert } from '@/components/win95';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, APIError } from '@/lib/api-client';
import { SubscriptionExpirationBanner } from '@/components/subscription-expiration-banner';
import { useSubscriptionStatus } from '@/lib/hooks/use-subscription-status';
import {
  FileText,
  Mail,
  Sparkles,
  Plus,
  ArrowRight,
  AlertCircle,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  RefreshCw,
  Globe,
  Calendar,
  Eye,
  ChevronRight,
  Zap,
  TrendingUp,
  Clock,
  PenTool,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ArticleStyle } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DeleteDialog } from '@/components/articles/delete-dialog';
// Tabs removed - using custom filter pills instead

interface Topic {
  rowIndex: number;
  topic: string;
  status: string;
  subject: string;
  article: string;
  lastUpdate: string;
  client: string;
}

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface DashboardData {
  profile: { display_name: string | null; email: string };
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

interface UsageData {
  articles_used: number;
  articles_limit: number;
  can_generate: boolean;
  plan: string;
}

const STATUS_OPTIONS = ['Needs Draft', 'In Progress', 'Review', 'Sent', 'Archived'];

const STATUS_COLORS: Record<string, string> = {
  'Needs Draft':
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  Review:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  Sent: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  Archived: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'Needs Draft': <PenTool className="h-3 w-3" />,
  'In Progress': <Loader2 className="h-3 w-3" />,
  Review: <Eye className="h-3 w-3" />,
  Sent: <Check className="h-3 w-3" />,
  Archived: <BookOpen className="h-3 w-3" />,
};

function DashboardContent() {
  const { user } = useAuth();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [styleLoading, setStyleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Subscription status for expiration handling - Requirements: 1.1, 4.3
  const {
    isExpired,
    expirationDate,
    status: subscriptionStatus,
    canAccessFeatures,
  } = useSubscriptionStatus();
  const [isRenewing, setIsRenewing] = useState(false);

  // Usage limits state
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Determine if features should be disabled (expired OR no active subscription OR usage limit reached)
  const usageLimitReached = usage ? !usage.can_generate : false;
  const featuresDisabled = !canAccessFeatures || usageLimitReached;

  // Navigate to pricing page for renewal/upgrade
  const handleRenewSubscription = useCallback(() => {
    setIsRenewing(true);
    window.location.href = '/pricing';
  }, []);

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [newTopic, setNewTopic] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [activeTopicTab, setActiveTopicTab] = useState('all');

  // Refs to prevent duplicate API calls
  const fetchingRef = React.useRef(false);
  const topicsFetchedRef = React.useRef(false);

  useEffect(() => {
    if (searchParams.get('payment_success') === 'true') {
      setShowPaymentSuccess(true);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, [searchParams]);

  const fetchTopics = async (styleData?: ArticleStyle | null) => {
    if (topicsFetchedRef.current && !styleData) return;
    try {
      setTopicsLoading(true);
      const response = await apiClient.get<{ topics: Topic[]; sheetName?: string }>('/topics');
      if ((!response.topics || response.topics.length === 0) && styleData?.subjects?.length) {
        const subjectTopics: Topic[] = styleData.subjects.map((subject, index) => ({
          rowIndex: index + 2,
          topic: subject,
          status: 'Needs Draft',
          subject: subject,
          article: '',
          lastUpdate: new Date().toISOString().split('T')[0],
          client: styleData.display_name || styleData.name || '',
        }));
        setTopics(subjectTopics);
      } else {
        setTopics(response.topics || []);
      }
      topicsFetchedRef.current = true;
    } catch (err) {
      // Skip logging for 401/403 - redirect is already happening
      if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
        return;
      }
      console.error('Failed to fetch topics:', err);
      if (styleData?.subjects?.length) {
        const subjectTopics: Topic[] = styleData.subjects.map((subject, index) => ({
          rowIndex: index + 2,
          topic: subject,
          status: 'Needs Draft',
          subject: subject,
          article: '',
          lastUpdate: new Date().toISOString().split('T')[0],
          client: styleData.display_name || styleData.name || '',
        }));
        setTopics(subjectTopics);
      }
    } finally {
      setTopicsLoading(false);
    }
  };

  // Stats sync state
  const [syncing, setSyncing] = useState(false);

  // Force sync stats from Google Sheets
  const handleSyncStats = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await apiClient.post('/stats/sync', {});
      // Refetch dashboard data after sync
      if (user) {
        const dashboardData = await apiClient.get<DashboardData>(
          `/dashboard/metrics?user_id=${user.id}`
        );
        setData(dashboardData);
      }
    } catch (err) {
      console.error('Failed to sync stats:', err);
    } finally {
      setSyncing(false);
    }
  }, [syncing, user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        setLoading(true);
        // Fetch all data in parallel, including stats sync
        const [dashboardData, stylesData, usageData] = await Promise.all([
          apiClient.get<DashboardData>(`/dashboard/metrics?user_id=${user.id}`),
          apiClient.get<ArticleStyle[]>(`/article-styles?user_id=${user.id}`),
          apiClient.get<UsageData>('/stripe/usage'),
          // Trigger background stats sync (don't await result)
          apiClient.get('/stats/sync?max_age=5').catch(() => null),
        ]);
        setData(dashboardData);
        setUsage(usageData);

        let userStyle = stylesData.length > 0 ? stylesData[0] : null;

        // If no article style exists, try to activate pending style data
        if (!userStyle) {
          try {
            const activateResponse = await apiClient.post<{
              success: boolean;
              style: ArticleStyle | null;
            }>('/stripe/activate-style', {});
            if (activateResponse.success && activateResponse.style) {
              userStyle = activateResponse.style;
            }
          } catch (activateErr) {
            console.error('Failed to activate pending style:', activateErr);
          }
        }

        setStyle(userStyle);
        await fetchTopics(userStyle);
      } catch (err: unknown) {
        // Skip setting error for 401/403 - redirect is already happening
        if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
      } finally {
        setLoading(false);
        setStyleLoading(false);
        fetchingRef.current = false;
      }
    };
    fetchData();
  }, [user]);

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;
    setAddingTopic(true);
    setTopicError(null);
    try {
      await apiClient.post('/topics', { topic: newTopic.trim() });
      setNewTopic('');
      topicsFetchedRef.current = false;
      await fetchTopics(style);
    } catch (err: unknown) {
      // Skip for 401/403 - redirect is already happening
      if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
        return;
      }
      if (err instanceof Error && err.message.includes('already exists')) {
        setTopicError('This topic already exists');
      } else {
        setTopicError('Failed to add topic');
      }
      setTimeout(() => setTopicError(null), 3000);
    } finally {
      setAddingTopic(false);
    }
  };

  const handleUpdateTopic = async (rowIndex: number, topic?: string, status?: string) => {
    setSavingTopic(true);
    setTopicError(null);
    try {
      await apiClient.put(`/topics/${rowIndex}`, { topic, status });
      setEditingRowIndex(null);
      topicsFetchedRef.current = false;
      await fetchTopics(style);
    } catch (err: unknown) {
      // Skip for 401/403 - redirect is already happening
      if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
        return;
      }
      console.error('Failed to update topic:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update topic';
      // Check if it's a limit reached error
      if (errorMessage.includes('limit reached') || errorMessage.includes('monthly limit')) {
        setTopicError(errorMessage);
      } else {
        setTopicError('Failed to update topic');
      }
      setTimeout(() => setTopicError(null), 5000);
    } finally {
      setSavingTopic(false);
    }
  };

  const openDeleteDialog = (topic: Topic) => {
    setTopicToDelete(topic);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    setDeletingRowIndex(topicToDelete.rowIndex);
    try {
      await apiClient.delete(`/topics/${topicToDelete.rowIndex}`);
      topicsFetchedRef.current = false;
      await fetchTopics(style);
      setDeleteDialogOpen(false);
      setTopicToDelete(null);
    } catch (err) {
      // Skip for 401/403 - redirect is already happening
      if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
        return;
      }
      console.error('Failed to delete topic:', err);
    } finally {
      setDeletingRowIndex(null);
    }
  };

  const startEditing = (topic: Topic) => {
    setEditingRowIndex(topic.rowIndex);
    setEditingTopic(topic.topic);
  };

  const cancelEditing = () => {
    setEditingRowIndex(null);
    setEditingTopic('');
  };

  const dismissPaymentSuccess = () => setShowPaymentSuccess(false);

  // Filter topics by status (case-insensitive for 'sent')
  const filteredTopics =
    activeTopicTab === 'all'
      ? topics
      : activeTopicTab === 'Sent'
        ? topics.filter(t => t.status.toLowerCase() === 'sent')
        : topics.filter(t => t.status === activeTopicTab);
  const displayedTopics = showAllTopics ? filteredTopics : filteredTopics.slice(0, 6);
  const topicCounts = {
    all: topics.length,
    'Needs Draft': topics.filter(t => t.status === 'Needs Draft').length,
    'Needs to be sent': topics.filter(t => t.status === 'Needs to be sent').length,
    Sent: topics.filter(t => t.status.toLowerCase() === 'sent').length,
  };

  // Win95 Design - keeping it simple
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
                {/* Subscription Expiration/Required Banner - Requirements: 1.1, 4.3 */}
                {!canAccessFeatures && (
                  <SubscriptionExpirationBanner
                    expirationDate={expirationDate}
                    onRenewClick={handleRenewSubscription}
                    isRenewing={isRenewing}
                    status={
                      subscriptionStatus === 'past_due'
                        ? 'past_due'
                        : subscriptionStatus === 'incomplete'
                          ? 'incomplete'
                          : 'canceled'
                    }
                    type="expired"
                  />
                )}
                {/* Usage Limit Reached Banner */}
                {canAccessFeatures && usageLimitReached && usage && (
                  <SubscriptionExpirationBanner
                    onRenewClick={handleRenewSubscription}
                    isRenewing={isRenewing}
                    type="limit_reached"
                    usageData={{
                      articles_used: usage.articles_used,
                      articles_limit: usage.articles_limit,
                    }}
                  />
                )}
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
                {style && (
                  <div className="win95-sunken p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold">📄 {style.name}</span>
                      {!featuresDisabled ? (
                        <Link href={`/articles/styles/${style.id}/edit`}>
                          <Win95Button size="sm">✏️ Edit</Win95Button>
                        </Link>
                      ) : (
                        <Win95Button size="sm" disabled title="Active subscription required">
                          ✏️ Edit
                        </Win95Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="win95-raised p-2">
                        <span className="text-[10px]">🌐</span>
                        <p className="text-[11px] font-bold">
                          {style.preferred_language.toUpperCase()}
                        </p>
                      </div>
                      <div className="win95-raised p-2">
                        <span className="text-[10px]">📅</span>
                        <p className="text-[11px] font-bold">{style.delivery_days.length} days</p>
                      </div>
                      <div className="win95-raised p-2">
                        <span className="text-[10px]">✨</span>
                        <p className="text-[11px] font-bold">{topics.length} topics</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Win95Window>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Modern Design - Loading State
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <DashboardHeader />
          <main className="pt-8 pb-20 px-4 md:px-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header Skeleton */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-80" />
                  <Skeleton className="h-5 w-96" />
                </div>
              </div>

              {/* Stats Grid Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  'from-blue-500/10 to-blue-500/5',
                  'from-emerald-500/10 to-emerald-500/5',
                  'from-amber-500/10 to-amber-500/5',
                  'from-purple-500/10 to-purple-500/5',
                ].map((gradient, i) => (
                  <Card
                    key={i}
                    className={`border-0 shadow-sm bg-gradient-to-br ${gradient} animate-pulse`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-9 w-12" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Content Grid Skeleton */}
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Style Card Skeleton */}
                <Card className="border-0 p-0 shadow-lg overflow-hidden lg:col-span-2">
                  <CardContent className="p-0">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-2xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-16 rounded-md" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Topics Section Skeleton */}
                <Card className="lg:col-span-3 p-0 border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6 space-y-4">
                      {/* Topics Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-16 rounded-md" />
                      </div>

                      {/* Add Topic Input Skeleton */}
                      <div className="flex gap-3">
                        <Skeleton className="h-10 flex-1 rounded-md" />
                        <Skeleton className="h-10 w-16 rounded-md" />
                      </div>

                      {/* Filter Pills Skeleton */}
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16 rounded-full" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                      </div>

                      {/* Topics List Skeleton */}
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-lg"
                            style={{ opacity: 1 - i * 0.15 }}
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                              </div>
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Skeleton */}
                      <div className="flex items-center justify-between pt-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Modern Design - Error State
  if (error || !data) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <DashboardHeader />
          <main className="pt-24 pb-20 px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex gap-3 items-start">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Something went wrong</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error || 'Failed to load dashboard'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const firstName = data.profile.display_name?.split(' ')[0] || 'there';

  // Modern Design - Main Dashboard
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <DashboardHeader />

        <main className="pt-8 pb-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Subscription Expiration/Required Banner - Requirements: 1.1, 4.3 */}
            {!canAccessFeatures && (
              <SubscriptionExpirationBanner
                expirationDate={expirationDate}
                onRenewClick={handleRenewSubscription}
                isRenewing={isRenewing}
                status={
                  subscriptionStatus === 'past_due'
                    ? 'past_due'
                    : subscriptionStatus === 'incomplete'
                      ? 'incomplete'
                      : 'canceled'
                }
                type="expired"
              />
            )}

            {/* Usage Limit Reached Banner */}
            {canAccessFeatures && usageLimitReached && usage && (
              <SubscriptionExpirationBanner
                onRenewClick={handleRenewSubscription}
                isRenewing={isRenewing}
                type="limit_reached"
                usageData={{
                  articles_used: usage.articles_used,
                  articles_limit: usage.articles_limit,
                }}
              />
            )}

            {/* Payment Success Banner */}
            {showPaymentSuccess && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white shadow-lg">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Welcome to Drafter Pro! 🎉</h3>
                      <p className="text-white/80">
                        Your subscription is now active. Start creating amazing content!
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={dismissPaymentSuccess}
                    className="shrink-0"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary mb-1">Dashboard</p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Welcome back, {firstName}! 👋
                </h1>
                <p className="text-muted-foreground mt-2">
                  Here's what's happening with your content today
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncStats}
                disabled={syncing}
                className="gap-2 self-start md:self-auto"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Stats'}
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Generated</p>
                      <p className="text-3xl font-bold mt-1">{data.metrics.articles_generated}</p>
                      {data.metrics.trends.articles_generated && (
                        <p
                          className={`text-xs mt-1 flex items-center gap-1 ${data.metrics.trends.articles_generated.isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {data.metrics.trends.articles_generated.value}% this month
                        </p>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sent</p>
                      <p className="text-3xl font-bold mt-1">{data.metrics.articles_sent}</p>
                      {data.metrics.trends.articles_sent && (
                        <p
                          className={`text-xs mt-1 flex items-center gap-1 ${data.metrics.trends.articles_sent.isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {data.metrics.trends.articles_sent.value}% this month
                        </p>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Draft</p>
                      <p className="text-3xl font-bold mt-1">{data.metrics.draft_articles}</p>
                      <p className="text-xs mt-1 text-muted-foreground">Awaiting review</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <PenTool className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Topics</p>
                      <p className="text-3xl font-bold mt-1">{topics.length}</p>
                      <p className="text-xs mt-1 text-muted-foreground flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {topicCounts['Needs Draft']} draft
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {topicCounts.Sent} sent
                        </span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Article Style Card - Takes 2 columns */}
              <Card className="border-0 p-0 shadow-lg overflow-hidden lg:col-span-2 group hover:shadow-xl transition-all duration-500">
                <CardContent className="p-0">
                  {styleLoading ? (
                    <div className="p-6 space-y-4">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                      </div>
                    </div>
                  ) : style ? (
                    <div className="relative">
                      {/* Header Section */}
                      <div className="p-6 pb-4 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{style.name}</h3>
                              <p className="text-sm text-muted-foreground">Your Writing Style</p>
                            </div>
                          </div>
                          {!featuresDisabled ? (
                            <Link href={`/articles/styles/${style.id}/edit`}>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-2 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled
                              className="gap-2"
                              title="Active subscription required to edit style"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="relative overflow-hidden p-3 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur border border-white/20 dark:border-gray-700/30 group/stat hover:scale-105 transition-transform duration-200">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                            <Globe className="h-5 w-5 text-blue-500 mb-2" />
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              Language
                            </p>
                            <p className="font-bold text-lg">
                              {style.preferred_language.toUpperCase()}
                            </p>
                          </div>
                          <div className="relative overflow-hidden p-3 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur border border-white/20 dark:border-gray-700/30 group/stat hover:scale-105 transition-transform duration-200">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                            <Calendar className="h-5 w-5 text-emerald-500 mb-2" />
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              Schedule
                            </p>
                            <p className="font-bold text-sm">
                              {style.delivery_days
                                .map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3))
                                .join(', ')}
                            </p>
                          </div>
                          <div className="relative overflow-hidden p-3 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur border border-white/20 dark:border-gray-700/30 group/stat hover:scale-105 transition-transform duration-200">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                            <Sparkles className="h-5 w-5 text-purple-500 mb-2" />
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              Topics
                            </p>
                            <p className="font-bold text-lg">{topics.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Writing Samples Section */}
                      {style.style_samples.length > 0 && (
                        <div className="px-6 pb-6 pt-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5" />
                            Writing Samples ({style.style_samples.length})
                          </p>
                          <div className="space-y-2">
                            {style.style_samples.slice(0, 3).map((sample, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 text-[10px] font-semibold"
                                  >
                                    Sample {idx + 1}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                  "{sample.substring(0, 120)}
                                  {sample.length > 120 ? '...' : ''}"
                                </p>
                              </div>
                            ))}
                            {style.style_samples.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center pt-1">
                                +{style.style_samples.length - 3} more samples
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="px-6 pb-6">
                        <div className="flex gap-2">
                          {featuresDisabled ? (
                            <Button
                              variant="outline"
                              className="w-full gap-2"
                              disabled
                              title="Active subscription required"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          ) : (
                            <Link href={`/articles/styles/${style.id}`} className="flex-1">
                              <Button variant="outline" className="w-full gap-2 group/btn">
                                <Eye className="h-4 w-4" />
                                View Details
                                <ArrowRight className="h-3.5 w-3.5 opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-5">
                        <FileText className="h-10 w-10 text-purple-500" />
                      </div>
                      <h3 className="font-bold text-xl mb-2">Create Your Style</h3>
                      <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                        Define your unique writing voice and start generating personalized content
                      </p>
                      <Link href="/articles/generate/step-1">
                        <Button className="gap-2 shadow-lg shadow-primary/25">
                          <Plus className="h-4 w-4" />
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Topics Section - Takes 3 columns */}
              <Card className="lg:col-span-3 p-0 border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  {/* Topics Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Your Topics</h2>
                        <p className="text-sm text-muted-foreground">
                          Manage and track your content
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        topicsFetchedRef.current = false;
                        fetchTopics(style);
                      }}
                      disabled={topicsLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${topicsLoading ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                  </div>

                  {/* Add Topic Input - Disabled when subscription not active or usage limit reached */}
                  <div className="flex gap-3 px-6">
                    <div className="relative flex-1">
                      <Input
                        placeholder={
                          usageLimitReached
                            ? `Monthly limit reached (${usage?.articles_used}/${usage?.articles_limit})`
                            : featuresDisabled
                              ? 'Active subscription required to add topics'
                              : 'Enter a new topic to write about...'
                        }
                        value={newTopic}
                        onChange={e => {
                          setNewTopic(e.target.value);
                          setTopicError(null);
                        }}
                        onKeyDown={e => e.key === 'Enter' && !featuresDisabled && handleAddTopic()}
                        disabled={addingTopic || featuresDisabled}
                        className={`h-10 ${topicError ? 'border-destructive' : ''}`}
                      />
                    </div>
                    <Button
                      onClick={handleAddTopic}
                      disabled={addingTopic || !newTopic.trim() || featuresDisabled}
                      className="h-10 px-4 gap-2"
                      title={
                        usageLimitReached
                          ? `Monthly limit reached (${usage?.articles_used}/${usage?.articles_limit})`
                          : featuresDisabled
                            ? 'Active subscription required to add topics'
                            : undefined
                      }
                    >
                      {addingTopic ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> Add
                        </>
                      )}
                    </Button>
                  </div>
                  {topicError && <p className="text-sm text-destructive px-6">{topicError}</p>}

                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap gap-2 px-6 pt-4">
                    {[
                      {
                        key: 'all',
                        label: 'All',
                        count: topicCounts.all,
                        color: 'bg-muted hover:bg-muted/80',
                      },
                      {
                        key: 'Needs Draft',
                        label: 'Needs Draft',
                        count: topicCounts['Needs Draft'],
                        color:
                          'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
                        icon: <PenTool className="h-3 w-3" />,
                      },
                      {
                        key: 'Needs to be sent',
                        label: 'Needs to be sent',
                        count: topicCounts['Needs to be sent'],
                        color:
                          'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
                        icon: <Loader2 className="h-3 w-3" />,
                      },
                      {
                        key: 'Sent',
                        label: 'Sent',
                        count: topicCounts.Sent,
                        color:
                          'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
                        icon: <Check className="h-3 w-3" />,
                      },
                    ].map(filter => (
                      <button
                        key={filter.key}
                        onClick={() => setActiveTopicTab(filter.key)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          activeTopicTab === filter.key
                            ? 'ring-2 ring-primary ring-offset-2 ' + filter.color
                            : filter.color + ' opacity-70 hover:opacity-100'
                        }`}
                      >
                        {filter.icon}
                        {filter.label}
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
                          {filter.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Topics List */}
                  {topicsLoading ? (
                    <div className="space-y-2 px-6 pt-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredTopics.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <Sparkles className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">No topics found</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeTopicTab === 'all'
                          ? 'Add your first topic above!'
                          : `No "${activeTopicTab}" topics yet`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 px-6 pt-4">
                      {displayedTopics.map(topic => (
                        <div
                          key={topic.rowIndex}
                          className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {editingRowIndex === topic.rowIndex ? (
                            <div className="flex-1 flex gap-2">
                              <Input
                                value={editingTopic}
                                onChange={e => setEditingTopic(e.target.value)}
                                autoFocus
                                className="flex-1"
                                onKeyDown={e =>
                                  e.key === 'Enter' &&
                                  handleUpdateTopic(topic.rowIndex, editingTopic)
                                }
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTopic(topic.rowIndex, editingTopic)}
                                disabled={savingTopic}
                              >
                                {savingTopic ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-1">
                                  <p className="font-medium text-sm">{topic.topic}</p>
                                  <Badge
                                    variant="outline"
                                    className={`shrink-0 text-[10px] ${STATUS_COLORS[topic.status.toLowerCase() === 'sent' ? 'Sent' : topic.status]}`}
                                  >
                                    {topic.status.toLowerCase() === 'sent' ? 'sent' : topic.status}
                                  </Badge>
                                </div>
                                {topic.article && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                                    {topic.article}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">{topic.lastUpdate}</p>
                              </div>
                              {/* Edit/Delete buttons - Hidden when subscription not active */}
                              {!featuresDisabled && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => startEditing(topic)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => openDeleteDialog(topic)}
                                    disabled={deletingRowIndex === topic.rowIndex}
                                  >
                                    {deletingRowIndex === topic.rowIndex ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* View More */}
                  {filteredTopics.length > 6 && (
                    <div className="px-6 pt-2">
                      <Button
                        variant="ghost"
                        className="w-full gap-2"
                        onClick={() => setShowAllTopics(!showAllTopics)}
                      >
                        {showAllTopics ? (
                          'Show Less'
                        ) : (
                          <>
                            View All {filteredTopics.length} Topics{' '}
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Footer */}
                  {topics.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground px-6 py-4">
                      <span>
                        {topics.length} topic{topics.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Synced
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTopic}
        loading={deletingRowIndex !== null}
        title="Delete Topic"
        description={`Are you sure you want to delete "${topicToDelete?.topic}"? This action cannot be undone.`}
      />
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <DashboardHeader />
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </ProtectedRoute>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
