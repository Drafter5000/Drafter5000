'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, APIError } from '@/lib/api-client';
import {
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  User,
  FileText,
  BookOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Topic {
  rowIndex: number;
  topic: string;
  status: string;
  subject: string;
  article: string;
  lastUpdate: string;
  client: string;
}

interface TopicsResponse {
  topics: Topic[];
  sheetName?: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const rowIndex = params.id ? parseInt(params.id as string, 10) : null;

  useEffect(() => {
    const fetchArticle = async () => {
      if (!user || !rowIndex) return;

      try {
        setLoading(true);
        const response = await apiClient.get<TopicsResponse>('/topics');
        const foundArticle = response.topics.find(t => t.rowIndex === rowIndex);

        if (foundArticle) {
          setArticle(foundArticle);
        } else {
          setError('Article not found');
        }
      } catch (err: unknown) {
        if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load article';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [user, rowIndex]);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => copyToClipboard(text, field)}
          disabled={!text}
        >
          {copiedField === field ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copiedField === field ? 'Copied!' : 'Copy to clipboard'}</p>
      </TooltipContent>
    </Tooltip>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <DashboardHeader />
          <main className="pt-8 pb-20 px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-10 w-32" />
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !article) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <DashboardHeader />
          <main className="pt-8 pb-20 px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex gap-3 items-start">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Something went wrong</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error || 'Article not found'}
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <DashboardHeader />
        <main className="pt-8 pb-20 px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            {/* Article Header */}
            <Card className="border-0 p-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">Generated Article</h1>
                      <p className="text-muted-foreground">View your AI-generated content</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Generated
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Meta Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Last Updated
                      </p>
                      <p className="font-medium">{article.lastUpdate || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Client
                      </p>
                      <p className="font-medium">{article.client || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Topic
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <p className="font-medium">{article.topic}</p>
                  </div>
                </div>

                {/* Subject Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Subject
                      </p>
                    </div>
                    <CopyButton text={article.subject} field="subject" />
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border min-h-[60px]">
                    {article.subject ? (
                      <p className="font-medium">{article.subject}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No subject available</p>
                    )}
                  </div>
                </div>

                {/* Article Content Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Article
                      </p>
                    </div>
                    <CopyButton text={article.article} field="article" />
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border min-h-[200px]">
                    {article.article ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {article.article}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No article content available</p>
                    )}
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
