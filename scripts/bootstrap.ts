#!/usr/bin/env bun
/**
 * Bootstrap Script
 * Ensures default organization and required data exists
 * Run this on deployment or first setup
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function ensureDefaultOrganization() {
  console.log('🏢 Checking default organization...');

  const { data: existingOrg, error: fetchError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', DEFAULT_ORG_ID)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = not found, which is expected
    console.error('Error checking organization:', fetchError);
    return false;
  }

  if (existingOrg) {
    console.log('   ✅ Default organization exists');
    return true;
  }

  // Create default organization
  const { error: insertError } = await supabase.from('organizations').insert({
    id: DEFAULT_ORG_ID,
    name: 'Default Organization',
    slug: 'default',
    settings: { is_default: true, allow_signups: true },
    is_active: true,
  });

  if (insertError) {
    console.error('Error creating default organization:', insertError);
    return false;
  }

  console.log('   ✅ Default organization created');
  return true;
}

async function checkSuperAdminConfig() {
  console.log('👤 Checking super admin configuration...');

  if (!SUPER_ADMIN_EMAIL) {
    console.log('   ⚠️  SUPER_ADMIN_EMAIL not set');
    console.log(
      '   💡 Set SUPER_ADMIN_EMAIL in your environment to auto-create super admin on signup'
    );
    return;
  }

  console.log(`   ✅ Super admin email configured: ${SUPER_ADMIN_EMAIL}`);

  // Check if super admin already exists
  const { data: existingAdmin } = await supabase
    .from('user_profiles')
    .select('id, email, is_super_admin')
    .eq('email', SUPER_ADMIN_EMAIL.toLowerCase())
    .single();

  if (existingAdmin) {
    if (existingAdmin.is_super_admin) {
      console.log('   ✅ Super admin account exists and is configured');
    } else {
      console.log('   ⚠️  User exists but is not super admin. Upgrading...');

      // Upgrade to super admin
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          is_super_admin: true,
          current_organization_id: DEFAULT_ORG_ID,
        })
        .eq('id', existingAdmin.id);

      if (updateError) {
        console.error('Error upgrading to super admin:', updateError);
        return;
      }

      // Add to organization as super_admin
      await supabase.from('organization_members').upsert({
        user_id: existingAdmin.id,
        organization_id: DEFAULT_ORG_ID,
        role: 'super_admin',
        is_active: true,
        joined_at: new Date().toISOString(),
      });

      console.log('   ✅ User upgraded to super admin');
    }
  } else {
    console.log('   💡 Super admin will be created when they sign up');
  }
}

async function ensureSubscriptionPlans() {
  console.log('💳 Checking subscription plans...');

  const { data: plans, error } = await supabase.from('subscription_plans').select('id').limit(1);

  if (error) {
    console.log('   ⚠️  Could not check plans (table may not exist)');
    return;
  }

  if (plans && plans.length > 0) {
    console.log('   ✅ Subscription plans exist');
  } else {
    console.log('   ⚠️  No subscription plans found');
    console.log('   💡 Run: bun run db:migrate to seed plans');
  }
}

async function bootstrap() {
  console.log('🚀 Running bootstrap...\n');

  await ensureDefaultOrganization();
  await checkSuperAdminConfig();
  await ensureSubscriptionPlans();

  console.log('\n✨ Bootstrap complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Set SUPER_ADMIN_EMAIL in your environment');
  console.log('   2. Sign up with that email to become super admin');
  console.log('   3. Configure Stripe products in the database');
}

bootstrap().catch(console.error);
