'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Users, DollarSign, TrendingUp } from 'lucide-react';
import type { AdminSession } from '@/lib/types';
import { UserRoleType } from '@/lib/types';
import { hasPlatformAccess, mapToUserRole } from '@/lib/role-config';
import type { BillingStatus, PlatformBillingOverview } from '@/lib/services/billing';

export default function AdminBillingPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [overview, setOverview] = useState<PlatformBillingOverview | null>(null);
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

  // Fetch billing data
  useEffect(() => {
    if (session) {
      const fetchBilling = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/admin/billing');
          if (res.ok) {
            const data = await res.json();
            if (data.type === 'platform') {
              setOverview(data.overview);
            } else {
              setBilling(data.billing);
            }
          }
        } catch (error) {
          console.error('Error fetching billing:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchBilling();
    }
  }, [session]);

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Platform overview for Super Admins
  if (isPlatformAdmin && overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Billing</h1>
          <p className="text-muted-foreground">Overview of all subscriptions and revenue</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.total_organizations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.active_subscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(overview.total_revenue_cents)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.total_organizations > 0
                  ? Math.round((overview.active_subscriptions / overview.total_organizations) * 100)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(overview.subscriptions_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscriptions by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(overview.subscriptions_by_plan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="capitalize">{plan}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Organization billing for Customer Admins
  if (billing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Billing information for {billing.organization_name}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <Badge className="capitalize">{billing.plan_name}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={billing.subscription_status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {billing.subscription_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Billing Cycle</span>
                <span className="capitalize">{billing.billing_cycle}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Billing amount and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-xl font-bold">
                  {formatCurrency(billing.amount_cents)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Next Billing</span>
                <span>{billing.next_billing_date || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Team information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="text-xl font-bold">{billing.member_count}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground">No billing information available</p>
    </div>
  );
}
