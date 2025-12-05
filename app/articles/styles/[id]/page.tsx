'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { DeleteDialog } from '@/components/articles/delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { FileText, Calendar, Pencil, Trash2, ArrowLeft, Loader2, Mail, User } from 'lucide-react';
import Link from 'next/link';
import type { ArticleStyle } from '@/lib/types';

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

const DAY_LABELS: Record<string, string> = {
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
        router.push('/articles/styles');
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
      router.push('/articles/styles');
    } finally {
      setDeleting(false);
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

  const flag = LANGUAGE_FLAGS[style.preferred_language] || '🌐';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/articles/styles">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>

            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{style.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(style.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/articles/styles/${id}/edit`}>
                  <Button variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-500" />
                    Delivery Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {style.email || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Display Name</p>
                    <p className="font-medium">{style.display_name || 'Not set'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-2">Delivery Days</p>
                    <div className="flex flex-wrap gap-2">
                      {style.delivery_days.length === 0 ? (
                        <span className="text-muted-foreground">No days selected</span>
                      ) : style.delivery_days.length === 7 ? (
                        <Badge>Every Day</Badge>
                      ) : (
                        style.delivery_days.map(day => (
                          <Badge key={day} variant="secondary">
                            {DAY_LABELS[day] || day}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-2">Language</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{flag}</span>
                      <span className="font-medium">{style.preferred_language.toUpperCase()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Topics ({style.subjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {style.subjects.length === 0 ? (
                    <p className="text-muted-foreground">No topics added</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {style.subjects.map((subject, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                        >
                          <Badge variant="outline" className="h-6 w-6 p-0 justify-center shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{subject}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Style Samples ({style.style_samples.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {style.style_samples.length === 0 ? (
                    <p className="text-muted-foreground">No style samples added</p>
                  ) : (
                    <div className="space-y-4">
                      {style.style_samples.map((sample, index) => (
                        <div key={index} className="rounded-lg border bg-secondary/30 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="h-6 w-6 p-0 justify-center">
                              {index + 1}
                            </Badge>
                            <span className="text-sm font-medium">Sample {index + 1}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {sample.split(/\s+/).length} words
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                            {sample}
                          </p>
                          {sample.length > 500 && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Showing preview... ({sample.length} characters total)
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Article Style"
        description={`Are you sure you want to delete "${style.name}"? This action cannot be undone.`}
      />
    </ProtectedRoute>
  );
}
