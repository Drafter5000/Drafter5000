'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { CreditCard, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function UsageContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Usage section skeleton */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Button skeletons */}
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

interface UsageData {
  plan: 'free' | 'pro' | 'enterprise';
  articles_used: number;
  articles_limit: number;
  percentage_used: number;
  can_generate: boolean;
}

export function BillingStatusCard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await apiClient.get<UsageData>('/stripe/usage');
        setUsage(data);
      } catch (error) {
        console.error('Usage fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const planName = usage?.plan ? usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1) : null;
  const isNearLimit = usage ? usage.percentage_used >= 80 : false;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Subscription
          </CardTitle>
          {loading ? (
            <Skeleton className="h-5 w-14 rounded-full" />
          ) : (
            usage && (
              <Badge variant={usage.plan === 'free' ? 'secondary' : 'default'}>{planName}</Badge>
            )
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <UsageContentSkeleton />
        ) : !usage ? null : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Usage</span>
                <span className="text-sm text-muted-foreground">
                  {usage.articles_used} / {usage.articles_limit}
                </span>
              </div>
              <Progress value={usage.percentage_used} className="h-2" />
            </div>

            {isNearLimit && (
              <div className="flex gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs">You're approaching your monthly limit</p>
              </div>
            )}

            {!usage.can_generate && (
              <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs">Monthly limit reached</p>
              </div>
            )}

            <Link href="/dashboard/billing" className="block">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <TrendingUp className="h-4 w-4" />
                View Details
              </Button>
            </Link>

            {usage.plan === 'free' && (
              <Link href="/pricing" className="block">
                <Button size="sm" className="w-full gap-2">
                  Upgrade Plan <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
