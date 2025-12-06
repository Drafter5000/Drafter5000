import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { getStripeClient } from '@/lib/stripe-client';
import type { SubscriptionPlan } from '@/lib/types';

/**
 * GET /api/admin/plans
 * Returns all subscription plans (including hidden ones) for admin management.
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const supabase = getSupabaseAdmin();
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch features for all plans
    const planIds = plans?.map(p => p.id) || [];
    const { data: features } = await supabase
      .from('plan_features')
      .select('*')
      .in('plan_id', planIds)
      .order('sort_order', { ascending: true });

    const plansWithFeatures = plans?.map(plan => ({
      ...plan,
      features: (features || []).filter(f => f.plan_id === plan.id),
    }));

    return NextResponse.json({ plans: plansWithFeatures });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch plans';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/admin/plans
 * Creates a new subscription plan and optionally syncs with Stripe.
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const {
      id,
      name,
      description,
      price_cents,
      currency = 'usd',
      articles_per_month,
      is_active = true,
      is_visible = true,
      is_highlighted = false,
      sort_order = 0,
      cta_text,
      cta_type = 'checkout',
      sync_to_stripe = true,
    } = body;

    if (!id || !name || articles_per_month === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, articles_per_month' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    let stripe_product_id: string | null = null;
    let stripe_price_id: string | null = null;

    // Create Stripe product and price for paid plans
    if (sync_to_stripe && price_cents > 0) {
      const stripe = getStripeClient();

      // Create product
      const product = await stripe.products.create({
        name,
        description: description || undefined,
        metadata: { plan_id: id },
      });
      stripe_product_id = product.id;

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: price_cents,
        currency: currency.toLowerCase(),
        recurring: { interval: 'month' },
        metadata: { plan_id: id },
      });
      stripe_price_id = price.id;
    }

    // Insert plan into database
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .insert({
        id,
        name,
        description,
        price_cents,
        currency,
        articles_per_month,
        stripe_product_id,
        stripe_price_id,
        is_active,
        is_visible,
        is_highlighted,
        sort_order,
        cta_text,
        cta_type,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create plan';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
