import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { getStripeClient } from '@/lib/stripe-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/plans/[id]
 * Returns a single subscription plan with features.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const supabase = getSupabaseAdmin();
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const { data: features } = await supabase
      .from('plan_features')
      .select('*')
      .eq('plan_id', id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ plan: { ...plan, features: features || [] } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch plan';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * PATCH /api/admin/plans/[id]
 * Updates a subscription plan. Can toggle visibility, update details, etc.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const body = await request.json();
    const {
      name,
      description,
      price_cents,
      currency,
      articles_per_month,
      is_active,
      is_visible,
      is_highlighted,
      sort_order,
      cta_text,
      cta_type,
      sync_to_stripe = false,
    } = body;

    const supabase = getSupabaseAdmin();

    // Get current plan
    const { data: currentPlan, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price_cents !== undefined) updates.price_cents = price_cents;
    if (currency !== undefined) updates.currency = currency;
    if (articles_per_month !== undefined) updates.articles_per_month = articles_per_month;
    if (is_active !== undefined) updates.is_active = is_active;
    if (is_visible !== undefined) updates.is_visible = is_visible;
    if (is_highlighted !== undefined) updates.is_highlighted = is_highlighted;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (cta_text !== undefined) updates.cta_text = cta_text;
    if (cta_type !== undefined) updates.cta_type = cta_type;

    // Sync to Stripe if requested and price changed
    if (sync_to_stripe && price_cents !== undefined && price_cents !== currentPlan.price_cents) {
      const stripe = getStripeClient();
      const finalCurrency = currency || currentPlan.currency;

      // Create new price (Stripe prices are immutable)
      if (currentPlan.stripe_product_id && price_cents > 0) {
        const newPrice = await stripe.prices.create({
          product: currentPlan.stripe_product_id,
          unit_amount: price_cents,
          currency: finalCurrency.toLowerCase(),
          recurring: { interval: 'month' },
          metadata: { plan_id: id },
        });
        updates.stripe_price_id = newPrice.id;

        // Deactivate old price
        if (currentPlan.stripe_price_id) {
          await stripe.prices.update(currentPlan.stripe_price_id, { active: false });
        }
      }
    }

    // Update Stripe product metadata if name/description changed
    if (sync_to_stripe && currentPlan.stripe_product_id && (name || description !== undefined)) {
      const stripe = getStripeClient();
      await stripe.products.update(currentPlan.stripe_product_id, {
        name: name || currentPlan.name,
        description: description ?? currentPlan.description ?? undefined,
      });
    }

    // Update database
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update plan';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * DELETE /api/admin/plans/[id]
 * Soft deletes a plan by setting is_active to false.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const supabase = getSupabaseAdmin();

    // Soft delete by setting is_active to false
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false, is_visible: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optionally deactivate Stripe product
    if (plan?.stripe_product_id) {
      try {
        const stripe = getStripeClient();
        await stripe.products.update(plan.stripe_product_id, { active: false });
      } catch (stripeError) {
        console.error('Failed to deactivate Stripe product:', stripeError);
      }
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete plan';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
