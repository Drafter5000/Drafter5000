'use client';

import { useState, useEffect, use, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { DeleteDialog } from '@/components/articles/delete-dialog';
import { Win95Window, Win95Button, Win95Badge } from '@/components/win95';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  FileText,
  Mail,
  User,
  Calendar,
  Globe,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  nl: '🇳🇱',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ko: '🇰🇷',
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
};

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const DAY_FULL: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export default function StyleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';
  const [style, setStyle] = useState<ArticleStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchStyle = async () => {
      if (!user) return;
      try {
        const data = await apiClient.get<ArticleStyle>(`/article-styles/${id}?user_id=${user.id}`);
        setStyle(data);
      } catch (err) {
        console.error('Failed to fetch style:', err);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStyle();
  }, [user, id, router]);

  const handleDelete = async () => {
    if (!user || !style) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/article-styles/${id}?user_id=${user.id}`);
      router.push('/dashboard');
    } finally {
      setDeleting(false);
    }
  };

  // Win95 Design
  if (designMode === 'win95') {
    if (loading) {
      return (
        <ProtectedRoute>
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto">
              <DashboardHeader />
              <Win95Window title="Loading..." icon={<span>📄</span>}>
                <div className="text-center py-8">
                  <span className="text-[11px] win95-loading">Loading style...</span>
                </div>
              </Win95Window>
            </div>
          </div>
        </ProtectedRoute>
      );
    }
    if (!style) return null;
    const flag = LANGUAGE_FLAGS[style.preferred_language] || '🌐';

    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4">
          <div className="max-w-4xl mx-auto">
            <DashboardHeader />
            <Win95Window title={`Style: ${style.name}`} icon={<span>📄</span>}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Link href="/dashboard">
                    <Win95Button size="sm">← Back</Win95Button>
                  </Link>
                  <div className="flex gap-1">
                    <Link href={`/articles/styles/${id}/edit`}>
                      <Win95Button size="sm">✏️ Edit</Win95Button>
                    </Link>
                    <Win95Button size="sm" onClick={() => setDeleteOpen(true)}>
                      🗑️ Delete
                    </Win95Button>
                  </div>
                </div>
                <div className="win95-sunken p-3">
                  <h1 className="text-[14px] font-bold">{style.name}</h1>
                  <p className="text-[10px] text-[var(--win95-button-shadow)]">
                    Created {new Date(style.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <div className="win95-raised p-2 text-center">
                    <span className="text-[10px]">🌐 Language</span>
                    <p className="text-[11px] font-bold">
                      {flag} {style.preferred_language.toUpperCase()}
                    </p>
                  </div>
                  <div className="win95-raised p-2 text-center">
                    <span className="text-[10px]">📅 Schedule</span>
                    <p className="text-[11px] font-bold">
                      {style.delivery_days.map(d => DAY_LABELS[d]).join(', ')}
                    </p>
                  </div>
                  <div className="win95-raised p-2 text-center">
                    <span className="text-[10px]">✨ Topics</span>
                    <p className="text-[11px] font-bold">{style.subjects.length}</p>
                  </div>
                </div>
                <div className="win95-sunken p-3">
                  <div className="text-[11px] font-bold mb-2">📝 Topics</div>
                  <div className="space-y-1">
                    {style.subjects.map((s, i) => (
                      <div key={i} className="win95-raised p-2 text-[11px]">
                        {i + 1}. {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="win95-sunken p-3">
                  <div className="text-[11px] font-bold mb-2">📄 Samples</div>
                  <div className="space-y-2">
                    {style.style_samples.map((s, i) => (
                      <div key={i} className="win95-field p-2">
                        <Win95Badge variant="outline">Sample {i + 1}</Win95Badge>
                        <p className="text-[10px] mt-1 line-clamp-3">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Win95Window>
          </div>
        </div>
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          loading={deleting}
          title="Delete Style"
          description={`Delete "${style.name}"? This cannot be undone.`}
        />
      </ProtectedRoute>
    );
  }

  // Modern Design - Loading
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <DashboardHeader />
          <main className="pt-8 pb-20 px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!style) return null;

  const flag = LANGUAGE_FLAGS[style.preferred_language] || '🌐';
  const langName =
    LANGUAGE_NAMES[style.preferred_language] || style.preferred_language.toUpperCase();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <DashboardHeader />

        <main className="pt-8 pb-20 px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{style.name}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Created{' '}
                      {new Date(style.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <Link href={`/articles/styles/${id}/edit`}>
                  <Button variant="outline" className="gap-2">
                    <Edit2 className="h-4 w-4" /> Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Language</p>
                      <p className="font-semibold">
                        {flag} {langName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery</p>
                      <p className="font-semibold">
                        {style.delivery_days.length === 7
                          ? 'Every Day'
                          : `${style.delivery_days.length} days/week`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Topics</p>
                      <p className="font-semibold">{style.subjects.length} active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Samples</p>
                      <p className="font-semibold">{style.style_samples.length} provided</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delivery Schedule */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Delivery Schedule
              </h2>
              <div className="flex flex-wrap gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
                  const isActive = style.delivery_days.includes(day);
                  return (
                    <div
                      key={day}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted/30 border-transparent text-muted-foreground'
                      }`}
                    >
                      <p className="text-xs font-medium">{DAY_FULL[day]}</p>
                      {isActive && <CheckCircle2 className="h-3 w-3 mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Topics Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Topics</h2>
                  <p className="text-sm text-muted-foreground">
                    {style.subjects.length} active topics
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                {style.subjects.map((subject, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-amber-600">{idx + 1}</span>
                    </div>
                    <p className="font-medium text-sm flex-1">{subject}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Writing Samples Section */}
            {style.style_samples.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Writing Samples</h2>
                    <p className="text-sm text-muted-foreground">
                      {style.style_samples.length} samples provided
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {style.style_samples.map((sample, idx) => (
                    <Card key={idx} className="border-0 shadow-sm bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="h-5 px-2 text-[10px] font-semibold bg-violet-500/10 text-violet-600 border-violet-500/30"
                          >
                            Sample {idx + 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          "{sample}"
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Style"
        description={`Are you sure you want to delete "${style.name}"? This action cannot be undone.`}
      />
    </ProtectedRoute>
  );
}
