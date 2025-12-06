'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

interface PlanTableProps {
  plans: SubscriptionPlanWithFeatures[];
  onToggleActive: (planId: string, isActive: boolean) => Promise<void>;
  onToggleVisible: (planId: string, isVisible: boolean) => Promise<void>;
}

export function PlanTable({ plans, onToggleActive, onToggleVisible }: PlanTableProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const formatPrice = (priceCents: number, currency: string) => {
    if (priceCents === 0) return 'Free';
    const amount = priceCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const handleToggleActive = async (planId: string, currentValue: boolean) => {
    setLoadingStates(prev => ({ ...prev, [`active-${planId}`]: true }));
    try {
      await onToggleActive(planId, !currentValue);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`active-${planId}`]: false }));
    }
  };

  const handleToggleVisible = async (planId: string, currentValue: boolean) => {
    setLoadingStates(prev => ({ ...prev, [`visible-${planId}`]: true }));
    try {
      await onToggleVisible(planId, !currentValue);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`visible-${planId}`]: false }));
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Articles/Month</TableHead>
            <TableHead>Features</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-center">Visible</TableHead>
            <TableHead className="text-center">Highlighted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No plans found
              </TableCell>
            </TableRow>
          ) : (
            plans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{plan.name}</span>
                    <span className="text-xs text-muted-foreground">{plan.id}</span>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(plan.price_cents, plan.currency)}</TableCell>
                <TableCell>{plan.articles_per_month}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{plan.features?.length || 0} features</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {loadingStates[`active-${plan.id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={() => handleToggleActive(plan.id, plan.is_active)}
                    />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {loadingStates[`visible-${plan.id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={plan.is_visible}
                        onCheckedChange={() => handleToggleVisible(plan.id, plan.is_visible)}
                      />
                      {plan.is_visible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {plan.is_highlighted ? (
                    <Badge variant="default">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/plans/${plan.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
