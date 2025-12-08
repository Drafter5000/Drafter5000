#!/usr/bin/env bun
/**
 * Full Database Reset Script for Hosted Supabase
 * Drops all tables and re-runs all migrations using the service role key
 *
 * Usage:
 *   bun run db:reset:full
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - exec_sql function must exist (run 00-setup-migrations.sql first)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';

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

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      return { success: false, error: data.error || 'Unknown error' };
    }
  }

  return { success: true };
}

async function dropAllTables() {
  console.log('🗑️  Dropping all tables...');

  // Drop tables in reverse dependency order
  const dropStatements = `
    -- Drop all policies first
    DO $$ 
    DECLARE 
      r RECORD;
    BEGIN
      FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
      END LOOP;
    END $$;

    -- Drop all tables in public schema (except _migrations)
    DO $$ 
    DECLARE 
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_migrations') LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
      END LOOP;
    END $$;

    -- Clear migrations history
    TRUNCATE TABLE _migrations;

    -- Delete all users from auth.users (use WHERE true to satisfy Supabase RLS)
    DELETE FROM auth.users WHERE true;
  `;

  const result = await executeSql(dropStatements);
  if (!result.success) {
    console.error('❌ Failed to drop tables:', result.error);
    return false;
  }

  console.log('✅ All tables dropped');
  return true;
}

async function runMigration(file: string, sql: string): Promise<boolean> {
  console.log(`📄 Executing: ${file}`);

  const result = await executeSql(sql);

  if (!result.success) {
    console.error(`   ❌ Failed: ${file}`);
    console.error(`   Error: ${result.error}`);
    return false;
  }

  // Record migration
  await supabase.from('_migrations').insert({ name: file });

  console.log(`   ✅ Completed: ${file}`);
  return true;
}

async function runAllMigrations() {
  const scriptsDir = join(process.cwd(), 'scripts');
  const sqlFiles = readdirSync(scriptsDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('00-'))
    .sort();

  console.log(`\n🚀 Running ${sqlFiles.length} migration(s)...\n`);

  for (const file of sqlFiles) {
    const filePath = join(scriptsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    const success = await runMigration(file, sql);
    if (!success) {
      return false;
    }
  }

  return true;
}

async function createSuperAdmin(): Promise<boolean> {
  if (!SUPER_ADMIN_EMAIL) {
    console.log('\n⚠️  SUPER_ADMIN_EMAIL not set, skipping admin creation');
    console.log('   💡 Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env.local');
    return true;
  }

  console.log('\n👤 Creating super admin user...');

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'Super Admin' },
  });

  if (authError) {
    console.error('   ❌ Failed to create auth user:', authError.message);
    return false;
  }

  if (!authData.user) {
    console.error('   ❌ No user returned from auth creation');
    return false;
  }

  const userId = authData.user.id;
  console.log('   ✅ Auth user created');

  // Create user profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: userId,
    email: SUPER_ADMIN_EMAIL.toLowerCase(),
    display_name: 'Super Admin',
    is_super_admin: true,
    current_organization_id: DEFAULT_ORG_ID,
    subscription_status: 'active',
    subscription_plan: 'enterprise',
  });

  if (profileError) {
    console.error('   ❌ Failed to create user profile:', profileError.message);
    return false;
  }
  console.log('   ✅ User profile created');

  // Add to organization
  const { error: memberError } = await supabase.from('organization_members').insert({
    user_id: userId,
    organization_id: DEFAULT_ORG_ID,
    role: 'super_admin',
    is_active: true,
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    console.error('   ❌ Failed to add to organization:', memberError.message);
    return false;
  }
  console.log('   ✅ Added to organization as super_admin');

  console.log('\n📋 Super Admin credentials:');
  console.log(`   Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);

  return true;
}

async function main() {
  console.log('🔄 Starting full database reset...\n');

  // Check if exec_sql function exists
  const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
  if (error?.message?.includes('does not exist')) {
    console.error('❌ exec_sql function not found!');
    console.error('   Run scripts/00-setup-migrations.sql in Supabase SQL Editor first.');
    process.exit(1);
  }

  // Drop all tables
  const dropped = await dropAllTables();
  if (!dropped) {
    process.exit(1);
  }

  // Run all migrations
  const migrated = await runAllMigrations();
  if (!migrated) {
    process.exit(1);
  }

  // Create super admin
  const adminCreated = await createSuperAdmin();
  if (!adminCreated) {
    console.error('⚠️  Database reset complete but admin creation failed');
    process.exit(1);
  }

  console.log('\n✨ Full database reset complete!');
}

main();
