'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlanForm } from '@/components/admin/plan-form';
import { PlanFeatureManager } from '@/components/admin/plan-feature-manager';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { SubscriptionPlanWithFeatures, PlanFeature } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPlanPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState<SubscriptionPlanWithFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/admin/plans/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Plan not found');
          } else {
            const data = await res.json();
            throw new Error(data.error || 'Failed to fetch plan');
          }
          return;
        }
        const data = await res.json();
        setPlan(data.plan);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch plan';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  const handleFeaturesChange = (features: PlanFeature[]) => {
    if (plan) {
      setPlan({ ...plan, features });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          {error || 'Plan not found'}
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/plans')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/plans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Plan: {plan.name}</h1>
          <p className="text-muted-foreground">Update plan details and features</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlanForm plan={plan} mode="edit" />
        </div>
        <div>
          <PlanFeatureManager
            planId={plan.id}
            features={plan.features || []}
            onFeaturesChange={handleFeaturesChange}
          />
        </div>
      </div>
    </div>
  );
}
