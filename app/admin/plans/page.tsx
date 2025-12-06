'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlanTable } from '@/components/admin/plan-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch plans');
      }
      const data = await res.json();
      setPlans(data.plans || []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleToggleActive = async (planId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update plan');
      }

      toast({
        title: 'Plan updated',
        description: `Plan ${isActive ? 'activated' : 'deactivated'} successfully`,
      });

      await fetchPlans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update plan';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleVisible = async (planId: string, isVisible: boolean) => {
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: isVisible }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update plan');
      }

      toast({
        title: 'Plan updated',
        description: `Plan visibility ${isVisible ? 'enabled' : 'disabled'} successfully`,
      });

      await fetchPlans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update plan';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage pricing plans and features</p>
        </div>
        <Link href="/admin/plans/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            All Plans
          </CardTitle>
          <CardDescription>
            View and manage all subscription plans. Toggle active status to control availability,
            and visibility to control display on the pricing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanTable
            plans={plans}
            onToggleActive={handleToggleActive}
            onToggleVisible={handleToggleVisible}
          />
        </CardContent>
      </Card>
    </div>
  );
}
