#!/usr/bin/env bun
/**
 * Stripe Subscription Sync Script
 *
 * This script synchronizes subscription plans between PostgreSQL and Stripe.
 * It ensures plans exist in both systems and keeps them in sync.
 *
 * Usage: bun run scripts/sync-stripe-subscription.ts
 *
 * Options:
 *   --dry-run    Preview changes without making them
 *   --force      Force update of existing Stripe products/prices
 *
 * Features:
 *   - Creates Stripe products/prices for plans that don't have them
 *   - Skips plans that already have valid Stripe IDs (unless --force)
 *   - Updates database with Stripe IDs after creation
 *   - Validates existing Stripe resources
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Missing STRIPE_SECRET_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY);

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  articles_per_month: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  is_visible: boolean;
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const forceUpdate = args.includes('--force');

/**
 * Validate if a Stripe product exists and is active
 */
async function validateStripeProduct(productId: string): Promise<boolean> {
  try {
    const product = await stripe.products.retrieve(productId);
    return product.active;
  } catch {
    return false;
  }
}

/**
 * Validate if a Stripe price exists and is active
 */
async function validateStripePrice(priceId: string): Promise<boolean> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return price.active;
  } catch {
    return false;
  }
}

/**
 * Sync a single plan to Stripe
 */
async function syncPlanToStripe(plan: SubscriptionPlan): Promise<{
  productId: string | null;
  priceId: string | null;
  action: 'created' | 'existing' | 'skipped' | 'updated';
}> {
  // Skip free plans
  if (plan.price_cents === 0) {
    console.log(`  ⏭️  Skipping ${plan.name} (free plan - no Stripe sync needed)`);
    return { productId: null, priceId: null, action: 'skipped' };
  }

  let productId = plan.stripe_product_id;
  let priceId = plan.stripe_price_id;
  let action: 'created' | 'existing' | 'skipped' | 'updated' = 'existing';

  // Check if existing Stripe IDs are valid
  const productValid = productId ? await validateStripeProduct(productId) : false;
  const priceValid = priceId ? await validateStripePrice(priceId) : false;

  // If both are valid and not forcing update, skip
  if (productValid && priceValid && !forceUpdate) {
    console.log(`  ✓ ${plan.name} already synced (product: ${productId}, price: ${priceId})`);
    return { productId, priceId, action: 'existing' };
  }

  // Create or find product
  if (!productValid || forceUpdate) {
    // Search for existing product by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_id']:'${plan.id}'`,
    });

    if (existingProducts.data.length > 0 && !forceUpdate) {
      productId = existingProducts.data[0].id;
      console.log(`  📦 Found existing product: ${productId}`);
    } else {
      if (isDryRun) {
        console.log(`  📦 Would create product: ${plan.name}`);
        productId = `prod_dry_run_${plan.id}`;
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
        action = 'created';
        console.log(`  ✅ Created product: ${productId}`);
      }
    }
  }

  // Create or find price
  if (!priceValid || forceUpdate) {
    if (productId && !productId.startsWith('prod_dry_run_')) {
      // Search for existing matching price
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

      if (matchingPrice && !forceUpdate) {
        priceId = matchingPrice.id;
        console.log(`  💰 Found existing price: ${priceId}`);
      } else {
        if (isDryRun) {
          console.log(
            `  💰 Would create price: $${(plan.price_cents / 100).toFixed(2)}/${plan.currency}/month`
          );
          priceId = `price_dry_run_${plan.id}`;
        } else {
          const price = await stripe.prices.create({
            product: productId,
            unit_amount: plan.price_cents,
            currency: plan.currency.toLowerCase(),
            recurring: { interval: 'month' },
            metadata: { plan_id: plan.id },
          });
          priceId = price.id;
          action = action === 'created' ? 'created' : 'updated';
          console.log(`  ✅ Created price: ${priceId}`);
        }
      }
    } else if (isDryRun) {
      console.log(
        `  💰 Would create price: $${(plan.price_cents / 100).toFixed(2)}/${plan.currency}/month`
      );
      priceId = `price_dry_run_${plan.id}`;
    }
  }

  return { productId, priceId, action };
}

/**
 * Update plan in database with Stripe IDs
 */
async function updatePlanInDatabase(
  planId: string,
  productId: string | null,
  priceId: string | null
): Promise<void> {
  if (isDryRun) {
    console.log(`  📝 Would update database: product_id=${productId}, price_id=${priceId}`);
    return;
  }

  const { error } = await supabase
    .from('subscription_plans')
    .update({
      stripe_product_id: productId,
      stripe_price_id: priceId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (error) {
    console.error(`  ❌ Database update failed:`, error.message);
  } else {
    console.log(`  📝 Database updated`);
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('');
  console.log('🔄 Stripe Subscription Sync');
  console.log('===========================');
  console.log('');

  if (isDryRun) {
    console.log('🏃 DRY RUN MODE - No changes will be made\n');
  }

  if (forceUpdate) {
    console.log('⚠️  FORCE MODE - Will recreate Stripe resources\n');
  }

  // Fetch all active plans
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch plans:', error.message);
    process.exit(1);
  }

  if (!plans || plans.length === 0) {
    console.log('ℹ️  No active plans found in database');
    process.exit(0);
  }

  console.log(`📋 Found ${plans.length} active plan(s)\n`);

  const stats = {
    total: plans.length,
    created: 0,
    existing: 0,
    skipped: 0,
    updated: 0,
    errors: 0,
  };

  for (const plan of plans) {
    console.log(`\n🔹 ${plan.name} (${plan.id})`);
    console.log(`   Price: $${(plan.price_cents / 100).toFixed(2)}/${plan.currency}/month`);
    console.log(`   Articles: ${plan.articles_per_month}/month`);

    try {
      const { productId, priceId, action } = await syncPlanToStripe(plan);

      // Update database if IDs changed
      if (
        (productId !== plan.stripe_product_id || priceId !== plan.stripe_price_id) &&
        action !== 'skipped'
      ) {
        await updatePlanInDatabase(plan.id, productId, priceId);
      }

      stats[action]++;
    } catch (err) {
      console.error(`  ❌ Error:`, err);
      stats.errors++;
    }
  }

  // Summary
  console.log('\n===========================');
  console.log('📊 Summary:');
  console.log(`   Total plans: ${stats.total}`);
  console.log(`   Created: ${stats.created}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Already synced: ${stats.existing}`);
  console.log(`   Skipped (free): ${stats.skipped}`);
  if (stats.errors > 0) {
    console.log(`   Errors: ${stats.errors}`);
  }

  if (isDryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
