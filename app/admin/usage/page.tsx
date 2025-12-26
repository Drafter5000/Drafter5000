'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Users, HardDrive, Activity, Building2, Zap } from 'lucide-react';
import type { AdminSession } from '@/lib/types';
import { UserRoleType } from '@/lib/types';
import { hasPlatformAccess, mapToUserRole } from '@/lib/role-config';
import type { UsageMetrics, PlatformUsageMetrics } from '@/lib/services/usage';

export default function AdminUsagePage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [metrics, setMetrics] = useState<PlatformUsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, []);

  const userRoleType = session
    ? mapToUserRole(session.role, session.is_super_admin)
    : UserRoleType.CUSTOMER;
  const isPlatformAdmin = hasPlatformAccess(userRoleType);

  // Fetch usage data
  useEffect(() => {
    if (session) {
      const fetchUsage = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/admin/usage');
          if (res.ok) {
            const data = await res.json();
            if (data.type === 'platform') {
              setMetrics(data.metrics);
            } else {
              setUsage(data.usage);
            }
          }
        } catch (error) {
          console.error('Error fetching usage:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUsage();
    }
  }, [session]);

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Platform metrics for Super Admins
  if (isPlatformAdmin && metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Usage</h1>
          <p className="text-muted-foreground">Overview of platform-wide usage metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.total_articles)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(metrics.articles_this_month)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.total_users)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(metrics.active_users_month)} active this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.total_organizations)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(metrics.total_storage_bytes)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>API calls this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <div className="text-3xl font-bold">{formatNumber(metrics.api_calls_month)}</div>
                <p className="text-sm text-muted-foreground">API calls this billing period</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Organization usage for Customer Admins
  if (usage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Usage</h1>
          <p className="text-muted-foreground">Usage metrics for {usage.organization_name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(usage.article_count)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(usage.articles_this_month)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(usage.member_count)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(usage.storage_bytes)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(usage.api_calls_month)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {usage.last_activity && (
          <Card>
            <CardHeader>
              <CardTitle>Last Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {new Date(usage.last_activity).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground">No usage data available</p>
    </div>
  );
}
