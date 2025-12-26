'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionPlanWithFeatures } from '@/lib/types';

interface PlanFormProps {
  plan?: SubscriptionPlanWithFeatures;
  mode: 'create' | 'edit';
}

interface FormData {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  articles_per_month: number;
  is_active: boolean;
  is_visible: boolean;
  is_highlighted: boolean;
  sort_order: number;
  cta_text: string;
  cta_type: 'checkout' | 'email' | 'signup';
  sync_to_stripe: boolean;
}

export function PlanForm({ plan, mode }: PlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: plan?.id || '',
    name: plan?.name || '',
    description: plan?.description || '',
    price_cents: plan?.price_cents || 0,
    currency: plan?.currency || 'usd',
    articles_per_month: plan?.articles_per_month || 0,
    is_active: plan?.is_active ?? true,
    is_visible: plan?.is_visible ?? true,
    is_highlighted: plan?.is_highlighted ?? false,
    sort_order: plan?.sort_order || 0,
    cta_text: plan?.cta_text || '',
    cta_type: plan?.cta_type || 'checkout',
    sync_to_stripe: false,
  });

  const handleChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/admin/plans' : `/api/admin/plans/${plan?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${mode} plan`);
      }

      toast({
        title: 'Success',
        description: `Plan ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      router.push('/admin/plans');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to ${mode} plan`;
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const priceInDollars = formData.price_cents / 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core plan details and pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="id">Plan ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={e =>
                  handleChange('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="e.g., pro, enterprise"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for the plan. Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Pro Plan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Brief description of the plan"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (in dollars)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={priceInDollars}
                onChange={e =>
                  handleChange('price_cents', Math.round(parseFloat(e.target.value || '0') * 100))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={value => handleChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="articles_per_month">Articles per Month</Label>
            <Input
              id="articles_per_month"
              type="number"
              min="0"
              value={formData.articles_per_month}
              onChange={e => handleChange('articles_per_month', parseInt(e.target.value || '0'))}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Control how the plan appears on the pricing page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">Allow new subscriptions to this plan</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={checked => handleChange('is_active', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Visible on Pricing Page</Label>
              <p className="text-xs text-muted-foreground">
                Show this plan on the public pricing page
              </p>
            </div>
            <Switch
              checked={formData.is_visible}
              onCheckedChange={checked => handleChange('is_visible', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Highlighted</Label>
              <p className="text-xs text-muted-foreground">Feature this plan as recommended</p>
            </div>
            <Switch
              checked={formData.is_highlighted}
              onCheckedChange={checked => handleChange('is_highlighted', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={e => handleChange('sort_order', parseInt(e.target.value || '0'))}
            />
            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call to Action</CardTitle>
          <CardDescription>Button text and behavior on the pricing page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta_text">Button Text</Label>
            <Input
              id="cta_text"
              value={formData.cta_text}
              onChange={e => handleChange('cta_text', e.target.value)}
              placeholder="e.g., Get Started, Contact Sales"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta_type">Button Action</Label>
            <Select
              value={formData.cta_type}
              onValueChange={value =>
                handleChange('cta_type', value as 'checkout' | 'email' | 'signup')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkout">Stripe Checkout</SelectItem>
                <SelectItem value="signup">Sign Up (Free)</SelectItem>
                <SelectItem value="email">Contact Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {formData.price_cents > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe Integration</CardTitle>
            <CardDescription>Sync plan with Stripe for payment processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sync to Stripe</Label>
                <p className="text-xs text-muted-foreground">
                  {mode === 'create'
                    ? 'Create Stripe product and price'
                    : 'Update Stripe product (creates new price if amount changed)'}
                </p>
              </div>
              <Switch
                checked={formData.sync_to_stripe}
                onCheckedChange={checked => handleChange('sync_to_stripe', checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {mode === 'create' ? 'Create Plan' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
