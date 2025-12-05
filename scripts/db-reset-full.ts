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

    -- Delete all users from auth.users
    DELETE FROM auth.users;
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

  console.log('\n✨ Full database reset complete!');
}

main();
