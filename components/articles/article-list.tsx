'use client';

import { ArticleCard } from './article-card';
import { EmptyState } from './empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import type { ArticleWithStyle } from '@/lib/types';

interface ArticleListProps {
  articles: ArticleWithStyle[];
  loading?: boolean;
  emptyActionHref?: string;
  emptyActionLabel?: string;
}

export function ArticleList({
  articles,
  loading = false,
  emptyActionHref = '/articles/generate/step-1',
  emptyActionLabel = 'Create Article Style',
}: ArticleListProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No Articles Yet"
        description="Create an article style first, then generate articles based on your topics."
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
