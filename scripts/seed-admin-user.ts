#!/usr/bin/env bun
/**
 * Seed Admin User Script
 * Creates the default admin user for the Drafter organization
 * Email: admin@drafter.com
 * Password: Admin@123
 *
 * Run: bun run scripts/seed-admin-user.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_ADMIN_EMAIL = 'admin@drafter.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';
const DEFAULT_ADMIN_DISPLAY_NAME = 'Admin User';

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
  console.log('🏢 Ensuring default organization exists...');

  const { data: existingOrg, error: fetchError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', DEFAULT_ORG_ID)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking organization:', fetchError);
    return false;
  }

  if (existingOrg) {
    console.log('   ✅ Default organization exists');
    return true;
  }

  const { error: insertError } = await supabase.from('organizations').insert({
    id: DEFAULT_ORG_ID,
    name: 'Drafter',
    slug: 'drafter',
    settings: { is_default: true, allow_signups: true },
    is_active: true,
  });

  if (insertError) {
    console.error('Error creating organization:', insertError);
    return false;
  }

  console.log('   ✅ Default organization created');
  return true;
}

async function createDefaultAdminUser() {
  console.log('👤 Creating default admin user...');

  // Check if admin user already exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, email, is_super_admin')
    .eq('email', DEFAULT_ADMIN_EMAIL.toLowerCase())
    .single();

  if (existingProfile) {
    console.log('   ℹ️  Admin user already exists');

    if (!existingProfile.is_super_admin) {
      console.log('   🔄 Upgrading to super admin...');
      await supabase
        .from('user_profiles')
        .update({
          is_super_admin: true,
          current_organization_id: DEFAULT_ORG_ID,
        })
        .eq('id', existingProfile.id);
      console.log('   ✅ Upgraded to super admin');
    } else {
      console.log('   ✅ User is already super admin');
    }

    return existingProfile.id;
  }

  // Create auth user using Supabase Admin API
  console.log('   📧 Creating auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      display_name: DEFAULT_ADMIN_DISPLAY_NAME,
    },
  });

  if (authError) {
    // Check if user already exists in auth
    if (authError.message?.includes('already been registered')) {
      console.log('   ℹ️  Auth user exists, fetching...');
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingAuthUser = users?.users?.find(
        u => u.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()
      );

      if (existingAuthUser) {
        return await createOrUpdateProfile(existingAuthUser.id);
      }
    }
    console.error('Error creating auth user:', authError);
    return null;
  }

  if (!authData.user) {
    console.error('No user returned from auth creation');
    return null;
  }

  console.log('   ✅ Auth user created');
  return await createOrUpdateProfile(authData.user.id);
}

async function createOrUpdateProfile(userId: string) {
  console.log('   📝 Creating/updating user profile...');

  const { error: profileError } = await supabase.from('user_profiles').upsert(
    {
      id: userId,
      email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
      display_name: DEFAULT_ADMIN_DISPLAY_NAME,
      is_super_admin: true,
      current_organization_id: DEFAULT_ORG_ID,
      subscription_status: 'active',
      subscription_plan: 'enterprise',
    },
    {
      onConflict: 'id',
    }
  );

  if (profileError) {
    console.error('Error creating user profile:', profileError);
    return null;
  }

  console.log('   ✅ User profile created');
  return userId;
}

async function addAdminToOrganization(userId: string) {
  console.log('🏢 Adding admin to organization...');

  const { error } = await supabase.from('organization_members').upsert(
    {
      user_id: userId,
      organization_id: DEFAULT_ORG_ID,
      role: 'super_admin',
      is_active: true,
      joined_at: new Date().toISOString(),
    },
    {
      onConflict: 'organization_id,user_id',
    }
  );

  if (error) {
    console.error('Error adding admin to organization:', error);
    return false;
  }

  console.log('   ✅ Admin added to organization as super_admin');
  return true;
}

async function seedAdminUser() {
  console.log('🚀 Seeding default admin user...\n');

  // Ensure organization exists
  const orgCreated = await ensureDefaultOrganization();
  if (!orgCreated) {
    console.error('❌ Failed to ensure organization exists');
    process.exit(1);
  }

  // Create admin user
  const userId = await createDefaultAdminUser();
  if (!userId) {
    console.error('❌ Failed to create admin user');
    process.exit(1);
  }

  // Add to organization
  const addedToOrg = await addAdminToOrganization(userId);
  if (!addedToOrg) {
    console.error('❌ Failed to add admin to organization');
    process.exit(1);
  }

  console.log('\n✨ Admin user seeded successfully!');
  console.log('');
  console.log('📋 Admin credentials:');
  console.log(`   Email:    ${DEFAULT_ADMIN_EMAIL}`);
  console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
  console.log('');
  console.log('⚠️  Please change the password after first login!');
}

seedAdminUser().catch(console.error);
