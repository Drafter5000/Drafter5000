'use client';

import { StyleCard } from './style-card';
import { EmptyState } from './empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import type { ArticleStyle } from '@/lib/types';

interface StyleListProps {
  styles: ArticleStyle[];
  loading?: boolean;
  onDelete?: (id: string) => Promise<void>;
  emptyActionHref?: string;
  emptyActionLabel?: string;
}

export function StyleList({
  styles,
  loading = false,
  onDelete,
  emptyActionHref = '/articles/generate/step-1',
  emptyActionLabel = 'Create Your First Style',
}: StyleListProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No Article Styles Yet"
        description="Create your first article style to start generating personalized content."
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {styles.map(style => (
        <StyleCard key={style.id} style={style} onDelete={onDelete} />
      ))}
    </div>
  );
}
