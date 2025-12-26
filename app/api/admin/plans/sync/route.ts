import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { getStripeClient } from '@/lib/stripe-client';

/**
 * POST /api/admin/plans/sync
 * Syncs all active subscription plans with Stripe.
 * Creates products and prices for plans that don't have them.
 */
export async function POST() {
  try {
    await requireSuperAdmin();

    const supabase = getSupabaseAdmin();
    const stripe = getStripeClient();

    // Fetch all active plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!plans || plans.length === 0) {
      return NextResponse.json({ message: 'No active plans to sync', synced: [] });
    }

    const results: Array<{
      plan_id: string;
      name: string;
      status: 'synced' | 'skipped' | 'error';
      stripe_product_id?: string;
      stripe_price_id?: string;
      error?: string;
    }> = [];

    for (const plan of plans) {
      // Skip free plans
      if (plan.price_cents === 0) {
        results.push({
          plan_id: plan.id,
          name: plan.name,
          status: 'skipped',
        });
        continue;
      }

      try {
        let productId = plan.stripe_product_id;
        let priceId = plan.stripe_price_id;
        let needsUpdate = false;

        // Create or find product
        if (!productId) {
          // Search for existing product
          const existingProducts = await stripe.products.search({
            query: `metadata['plan_id']:'${plan.id}'`,
          });

          if (existingProducts.data.length > 0) {
            productId = existingProducts.data[0].id;
          } else {
            const product = await stripe.products.create({
              name: plan.name,
              description: plan.description || undefined,
              metadata: {
                plan_id: plan.id,
                articles_per_month: plan.articles_per_month.toString(),
              },
            });
            productId = product.id;
          }
          needsUpdate = true;
        }

        // Create or find price
        if (!priceId && productId) {
          const existingPrices = await stripe.prices.list({
            product: productId,
            active: true,
            type: 'recurring',
          });

          const matchingPrice = existingPrices.data.find(
            p =>
              p.unit_amount === plan.price_cents &&
              p.currency.toLowerCase() === plan.currency.toLowerCase() &&
              p.recurring?.interval === 'month'
          );

          if (matchingPrice) {
            priceId = matchingPrice.id;
          } else {
            const price = await stripe.prices.create({
              product: productId,
              unit_amount: plan.price_cents,
              currency: plan.currency.toLowerCase(),
              recurring: { interval: 'month' },
              metadata: { plan_id: plan.id },
            });
            priceId = price.id;
          }
          needsUpdate = true;
        }

        // Update database if needed
        if (needsUpdate) {
          await supabase
            .from('subscription_plans')
            .update({
              stripe_product_id: productId,
              stripe_price_id: priceId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', plan.id);
        }

        results.push({
          plan_id: plan.id,
          name: plan.name,
          status: 'synced',
          stripe_product_id: productId || undefined,
          stripe_price_id: priceId || undefined,
        });
      } catch (err) {
        results.push({
          plan_id: plan.id,
          name: plan.name,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const syncedCount = results.filter(r => r.status === 'synced').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      message: `Synced ${syncedCount} plans, skipped ${skippedCount}, errors ${errorCount}`,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync plans';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
