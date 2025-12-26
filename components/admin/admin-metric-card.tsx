'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface AdminMetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

export function AdminMetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
  className,
}: AdminMetricCardProps) {
  if (loading) {
    return (
      <Card className={cn('border-2', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-2 hover:border-primary/30 transition-colors', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold">{value}</p>
          <div className="flex items-center gap-2">
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
