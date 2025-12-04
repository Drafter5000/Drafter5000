'use client';

import { useEffect, useState } from 'react';
import { AdminMetricCard } from '@/components/admin/admin-metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, CreditCard, UserPlus, Activity } from 'lucide-react';
import type { DashboardMetrics, UserProfile } from '@/lib/types';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/admin/metrics');
        if (!res.ok) throw new Error('Failed to fetch metrics');
        const data = await res.json();
        setMetrics(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor your platform's health and activity</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Total Users"
          value={metrics?.total_users || 0}
          description="Registered accounts"
          icon={Users}
          loading={loading}
        />
        <AdminMetricCard
          title="Organizations"
          value={metrics?.total_organizations || 0}
          description="Active organizations"
          icon={Building2}
          loading={loading}
        />
        <AdminMetricCard
          title="Active Users"
          value={metrics?.active_users || 0}
          description="With active subscriptions"
          icon={Activity}
          loading={loading}
        />
        <AdminMetricCard
          title="New This Week"
          value={metrics?.recent_registrations?.length || 0}
          description="Recent registrations"
          icon={UserPlus}
          loading={loading}
        />
      </div>

      {/* Subscription Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscriptions by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics?.subscriptions_by_plan || {}).map(([plan, count]) => (
                  <div
                    key={plan}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={plan === 'enterprise' ? 'default' : 'secondary'}>
                        {plan}
                      </Badge>
                    </div>
                    <span className="font-semibold">{count} users</span>
                  </div>
                ))}
                {Object.keys(metrics?.subscriptions_by_plan || {}).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No subscription data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Recent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {metrics?.recent_registrations?.slice(0, 5).map((user: UserProfile) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">{user.display_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {(!metrics?.recent_registrations || metrics.recent_registrations.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">No recent registrations</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
