#!/usr/bin/env bun
/**
 * Database Initialization Script
 *
 * This script initializes the entire database from scratch:
 * 1. Sets up the migration system (exec_sql function)
 * 2. Runs all SQL migrations in order
 * 3. Seeds initial data (subscription plans, default org)
 * 4. Optionally syncs with Stripe
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL in .env.local
 * - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   bun run db:init              # Initialize database
 *   bun run db:init --with-stripe # Initialize and sync with Stripe
 *   bun run db:init --force      # Force re-run all migrations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Add these to your .env.local file.');
  console.error('Find SUPABASE_SERVICE_ROLE_KEY in Supabase Dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);
const withStripe = args.includes('--with-stripe');
const forceRun = args.includes('--force');

// Migration files in order (excluding 00-setup which is handled separately)
const MIGRATION_ORDER = [
  '01-schema.sql',
  '02-subscription-plans-schema.sql',
  '03-seed-subscription-plans.sql',
  '04-multi-tenant-schema.sql',
  '05-seed-default-organization.sql',
  '06-audit-logs-schema.sql',
  '07-article-styles-schema.sql',
  '08-migrate-onboarding-to-styles.sql',
  '09-add-plan-visibility.sql',
];

async function checkConnection(): Promise<boolean> {
  console.log('🔌 Checking Supabase connection...');

  try {
    // Use a simple health check that doesn't depend on any table existing
    // Query the auth.users table which always exists in Supabase
    const { error } = await supabase.auth.admin.listUsers({ perPage: 1 });

    if (error) {
      // Try alternative: check if we can reach the database at all
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });

      // If exec_sql doesn't exist, that's fine - we'll set it up
      if (
        rpcError &&
        !rpcError.message.includes('function') &&
        !rpcError.message.includes('does not exist')
      ) {
        console.error('   ❌ Connection failed:', rpcError.message);
        return false;
      }
    }

    console.log('   ✅ Connected to Supabase');
    return true;
  } catch (err) {
    console.error('   ❌ Connection failed:', err);
    return false;
  }
}

async function setupMigrationSystem(): Promise<boolean> {
  console.log('\n📦 Setting up migration system...');

  const scriptsDir = join(process.cwd(), 'scripts');
  const setupFile = join(scriptsDir, '00-setup-migrations.sql');

  if (!existsSync(setupFile)) {
    console.error('   ❌ Setup file not found:', setupFile);
    return false;
  }

  const setupSql = readFileSync(setupFile, 'utf-8');

  // Try to execute the setup SQL directly using Supabase's SQL execution
  // First check if exec_sql already exists
  const { error: checkError } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });

  if (!checkError) {
    // Check if uuid-ossp extension is enabled
    const { data: uuidResult } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT uuid_generate_v4()',
    });

    // exec_sql returns { success: false, error: "..." } on failure
    if (
      uuidResult &&
      typeof uuidResult === 'object' &&
      'success' in uuidResult &&
      !uuidResult.success
    ) {
      const errorMsg = (uuidResult as { error?: string }).error || '';
      if (errorMsg.includes('does not exist')) {
        console.log('   ⚠️  uuid-ossp extension not enabled');
        console.log('');
        console.log('   Please run this SQL in Supabase Dashboard > SQL Editor:');
        console.log('');
        console.log('   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        console.log('   CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        console.log('');
        console.log('   Then run this script again.');
        return false;
      }
    }

    console.log('   ✅ Migration system already set up');
    return true;
  }

  // Need to set up - this requires manual intervention for security
  console.log('   ⚠️  Migration system not set up');
  console.log('');
  console.log('   Please run the following SQL in Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('   ─'.repeat(30));
  console.log(setupSql);
  console.log('   ─'.repeat(30));
  console.log('');
  console.log('   Then run this script again.');

  return false;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { data, error } = await supabase.from('_migrations').select('name');

  if (error) {
    if (error.message.includes('does not exist')) {
      return new Set();
    }
    console.warn('   ⚠️  Could not fetch migration history:', error.message);
    return new Set();
  }

  return new Set(data?.map(m => m.name) || []);
}

async function recordMigration(name: string): Promise<void> {
  await supabase.from('_migrations').insert({ name });
}

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      return { success: false, error: (data as { error?: string }).error || 'Unknown error' };
    }
  }

  return { success: true };
}

async function runMigration(file: string, sql: string): Promise<boolean> {
  console.log(`   📄 ${file}`);

  const result = await executeSql(sql);

  if (!result.success) {
    console.error(`      ❌ Failed: ${result.error}`);
    return false;
  }

  await recordMigration(file);
  console.log(`      ✅ Applied`);
  return true;
}

async function runAllMigrations(): Promise<boolean> {
  console.log('\n🚀 Running database migrations...');

  const scriptsDir = join(process.cwd(), 'scripts');
  const appliedMigrations = forceRun ? new Set<string>() : await getAppliedMigrations();

  // Get all SQL files that exist
  const existingFiles = readdirSync(scriptsDir).filter(f => f.endsWith('.sql'));

  // Filter to migrations that need to run
  const pendingMigrations = MIGRATION_ORDER.filter(
    file => existingFiles.includes(file) && !appliedMigrations.has(file)
  );

  // Also check for any new migrations not in MIGRATION_ORDER
  const additionalMigrations = existingFiles
    .filter(f => !f.startsWith('00-') && !MIGRATION_ORDER.includes(f) && !appliedMigrations.has(f))
    .sort();

  const allPending = [...pendingMigrations, ...additionalMigrations];

  if (allPending.length === 0) {
    console.log('   ✅ All migrations already applied');
    return true;
  }

  console.log(`   Found ${allPending.length} pending migration(s)\n`);

  for (const file of allPending) {
    const filePath = join(scriptsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    const success = await runMigration(file, sql);
    if (!success) {
      console.log('');
      console.log('   💡 To run manually:');
      console.log('      1. Go to Supabase Dashboard > SQL Editor');
      console.log(`      2. Copy contents of scripts/${file}`);
      console.log('      3. Execute the query');
      return false;
    }
  }

  console.log('\n   ✅ All migrations applied successfully');
  return true;
}

async function runBootstrap(): Promise<void> {
  console.log('\n🏢 Running bootstrap...');

  const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

  // Check/create default organization
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', DEFAULT_ORG_ID)
    .single();

  if (!existingOrg) {
    const { error } = await supabase.from('organizations').insert({
      id: DEFAULT_ORG_ID,
      name: 'Drafter',
      slug: 'drafter',
      settings: { is_default: true, allow_signups: true },
      is_active: true,
    });

    if (error && !error.message.includes('duplicate')) {
      console.log('   ⚠️  Could not create default organization:', error.message);
    } else {
      console.log('   ✅ Default organization created');
    }
  } else {
    console.log('   ✅ Default organization exists');
  }

  // Check subscription plans
  const { data: plans } = await supabase.from('subscription_plans').select('id').limit(1);

  if (plans && plans.length > 0) {
    console.log('   ✅ Subscription plans exist');
  } else {
    console.log('   ⚠️  No subscription plans found - check seed migration');
  }
}

async function syncStripe(): Promise<void> {
  if (!withStripe) return;

  console.log('\n💳 Syncing with Stripe...');

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    console.log('   ⚠️  STRIPE_SECRET_KEY not set, skipping Stripe sync');
    return;
  }

  // Import and run the sync logic
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .gt('price_cents', 0);

    if (!plans || plans.length === 0) {
      console.log('   ℹ️  No paid plans to sync');
      return;
    }

    for (const plan of plans) {
      if (plan.stripe_product_id && plan.stripe_price_id) {
        console.log(`   ✅ ${plan.name} already synced`);
        continue;
      }

      console.log(`   🔄 Syncing ${plan.name}...`);

      // Create or find product
      let productId = plan.stripe_product_id;
      if (!productId) {
        const existingProducts = await stripe.products.search({
          query: `metadata['plan_id']:'${plan.id}'`,
        });

        if (existingProducts.data.length > 0) {
          productId = existingProducts.data[0].id;
        } else {
          const product = await stripe.products.create({
            name: plan.name,
            description: plan.description || undefined,
            metadata: { plan_id: plan.id },
          });
          productId = product.id;
        }
      }

      // Create or find price
      let priceId = plan.stripe_price_id;
      if (!priceId && productId) {
        const existingPrices = await stripe.prices.list({
          product: productId,
          active: true,
          type: 'recurring',
        });

        const matchingPrice = existingPrices.data.find(
          p =>
            p.unit_amount === plan.price_cents &&
            p.currency.toLowerCase() === plan.currency.toLowerCase()
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
      }

      // Update database
      await supabase
        .from('subscription_plans')
        .update({
          stripe_product_id: productId,
          stripe_price_id: priceId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      console.log(`      ✅ Synced (product: ${productId}, price: ${priceId})`);
    }
  } catch (err) {
    console.error('   ❌ Stripe sync failed:', err);
  }
}

async function main() {
  console.log('═'.repeat(50));
  console.log('  Drafter Database Initialization');
  console.log('═'.repeat(50));

  if (forceRun) {
    console.log('⚠️  FORCE MODE - Will re-run all migrations\n');
  }

  // Step 1: Check connection
  const connected = await checkConnection();
  if (!connected) {
    process.exit(1);
  }

  // Step 2: Setup migration system
  const migrationSystemReady = await setupMigrationSystem();
  if (!migrationSystemReady) {
    process.exit(1);
  }

  // Step 3: Run migrations
  const migrationsSuccess = await runAllMigrations();
  if (!migrationsSuccess) {
    process.exit(1);
  }

  // Step 4: Run bootstrap
  await runBootstrap();

  // Step 5: Sync with Stripe (optional)
  await syncStripe();

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('  ✨ Database initialization complete!');
  console.log('═'.repeat(50));
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Set SUPER_ADMIN_EMAIL in .env.local');
  console.log('   2. Sign up with that email to become super admin');
  if (!withStripe) {
    console.log('   3. Run `bun run stripe:sync` to sync plans with Stripe');
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
