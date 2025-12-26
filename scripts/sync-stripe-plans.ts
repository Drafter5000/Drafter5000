#!/usr/bin/env bun
/**
 * Stripe Plans Sync Script
 *
 * This script synchronizes subscription plans between the database and Stripe.
 * It creates Stripe products and prices for plans that don't have them,
 * and updates the database with the Stripe IDs.
 *
 * Usage: bun run scripts/sync-stripe-plans.ts
 *
 * Options:
 *   --dry-run    Preview changes without making them
 *   --force      Force recreation of Stripe products/prices even if they exist
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
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
const forceRecreate = args.includes('--force');

async function syncPlanToStripe(plan: SubscriptionPlan): Promise<{
  productId: string | null;
  priceId: string | null;
  created: boolean;
}> {
  // Skip free plans - they don't need Stripe products
  if (plan.price_cents === 0) {
    console.log(`  ⏭️  Skipping ${plan.name} (free plan)`);
    return { productId: null, priceId: null, created: false };
  }

  let productId = plan.stripe_product_id;
  let priceId = plan.stripe_price_id;
  let created = false;

  // Check if we need to create/find a product
  if (!productId || forceRecreate) {
    // Search for existing product by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_id']:'${plan.id}'`,
    });

    if (existingProducts.data.length > 0 && !forceRecreate) {
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
        created = true;
        console.log(`  ✅ Created product: ${productId}`);
      }
    }
  } else {
    console.log(`  📦 Using existing product: ${productId}`);
  }

  // Check if we need to create/find a price
  if (!priceId || forceRecreate) {
    if (productId && !productId.startsWith('prod_dry_run_')) {
      // Search for existing price
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

      if (matchingPrice && !forceRecreate) {
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
            recurring: {
              interval: 'month',
            },
            metadata: {
              plan_id: plan.id,
            },
          });
          priceId = price.id;
          created = true;
          console.log(`  ✅ Created price: ${priceId}`);
        }
      }
    } else if (isDryRun) {
      console.log(
        `  💰 Would create price: $${(plan.price_cents / 100).toFixed(2)}/${plan.currency}/month`
      );
      priceId = `price_dry_run_${plan.id}`;
    }
  } else {
    console.log(`  💰 Using existing price: ${priceId}`);
  }

  return { productId, priceId, created };
}

async function updatePlanInDatabase(
  planId: string,
  productId: string | null,
  priceId: string | null
): Promise<void> {
  if (isDryRun) {
    console.log(`  📝 Would update database with product_id=${productId}, price_id=${priceId}`);
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
    console.error(`  ❌ Failed to update database:`, error.message);
  } else {
    console.log(`  📝 Updated database`);
  }
}

async function main() {
  console.log('🔄 Stripe Plans Sync');
  console.log('====================');

  if (isDryRun) {
    console.log('🏃 DRY RUN MODE - No changes will be made\n');
  }

  if (forceRecreate) {
    console.log('⚠️  FORCE MODE - Will recreate Stripe resources\n');
  }

  // Fetch all active plans from database
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

  let syncedCount = 0;
  let createdCount = 0;

  for (const plan of plans) {
    console.log(`\n🔹 Processing: ${plan.name} (${plan.id})`);
    console.log(`   Price: $${(plan.price_cents / 100).toFixed(2)}/${plan.currency}/month`);
    console.log(`   Visible: ${plan.is_visible ? 'Yes' : 'No'}`);

    try {
      const { productId, priceId, created } = await syncPlanToStripe(plan);

      // Update database if we have new IDs
      if (productId !== plan.stripe_product_id || priceId !== plan.stripe_price_id) {
        await updatePlanInDatabase(plan.id, productId, priceId);
        syncedCount++;
      }

      if (created) {
        createdCount++;
      }
    } catch (err) {
      console.error(`  ❌ Error syncing plan:`, err);
    }
  }

  console.log('\n====================');
  console.log('📊 Summary:');
  console.log(`   Plans processed: ${plans.length}`);
  console.log(`   Plans synced: ${syncedCount}`);
  console.log(`   Stripe resources created: ${createdCount}`);

  if (isDryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main().catch(console.error);
