'use client';

import Link from 'next/link';
import { PlanForm } from '@/components/admin/plan-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewPlanPage() {
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
          <h1 className="text-3xl font-bold">Create New Plan</h1>
          <p className="text-muted-foreground">Add a new subscription plan</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PlanForm mode="create" />
      </div>
    </div>
  );
}
