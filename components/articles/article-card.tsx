'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, Send, Archive } from 'lucide-react';
import type { ArticleWithStyle } from '@/lib/types';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    variant: 'secondary' as const,
    icon: Clock,
  },
  pending: {
    label: 'Pending',
    variant: 'outline' as const,
    icon: Clock,
  },
  sent: {
    label: 'Sent',
    variant: 'default' as const,
    icon: Send,
  },
  archived: {
    label: 'Archived',
    variant: 'secondary' as const,
    icon: Archive,
  },
};

interface ArticleCardProps {
  article: ArticleWithStyle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const status = STATUS_CONFIG[article.status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;
  const generatedDate = article.generated_at
    ? new Date(article.generated_at).toLocaleDateString()
    : new Date(article.created_at).toLocaleDateString();

  return (
    <Link href={`/articles/${article.id}`}>
      <Card className="group hover:border-primary/30 transition-colors cursor-pointer">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {article.subject}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={status.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{generatedDate}</span>
              </div>
              {article.style_name && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  Style: {article.style_name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
