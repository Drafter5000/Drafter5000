#!/usr/bin/env bun
/**
 * Database Migration Script
 * Runs SQL migrations against Supabase
 *
 * Prerequisites:
 * 1. Run scripts/00-setup-migrations.sql manually in Supabase SQL Editor (one-time setup)
 * 2. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   bun run db:migrate              # Run all pending migrations
 *   bun run db:migrate 04-multi-tenant-schema.sql  # Run specific migration
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
  console.error('');
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
  console.error('Find it in Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function checkMigrationSetup(): Promise<boolean> {
  // Check if exec_sql function exists
  const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });

  if (error?.message?.includes('function') && error?.message?.includes('does not exist')) {
    return false;
  }
  return true;
}

async function getAppliedMigrations(): Promise<string[]> {
  const { data, error } = await supabase.from('_migrations').select('name');

  if (error) {
    // Table might not exist yet
    if (error.message.includes('does not exist')) {
      return [];
    }
    console.warn('⚠️  Could not fetch migration history:', error.message);
    return [];
  }

  return data?.map(m => m.name) || [];
}

async function recordMigration(name: string): Promise<void> {
  await supabase.from('_migrations').insert({ name });
}

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    return { success: false, error: error.message };
  }

  // Check if the function returned an error
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      return { success: false, error: data.error || 'Unknown error' };
    }
  }

  return { success: true };
}

async function runMigration(file: string, sql: string): Promise<boolean> {
  console.log(`📄 Executing: ${file}`);

  const result = await executeSql(sql);

  if (!result.success) {
    console.error(`   ❌ Failed: ${file}`);
    console.error(`   Error: ${result.error}`);
    return false;
  }

  console.log(`   ✅ Completed: ${file}`);
  await recordMigration(file);
  return true;
}

async function runAllMigrations() {
  const scriptsDir = join(process.cwd(), 'scripts');
  const sqlFiles = readdirSync(scriptsDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('00-')) // Skip setup file
    .sort();

  // Check if migration system is set up
  const isSetup = await checkMigrationSetup();
  if (!isSetup) {
    console.error('❌ Migration system not set up!');
    console.error('');
    console.error('Run this SQL in Supabase Dashboard > SQL Editor:');
    console.error('');
    console.error('─'.repeat(60));
    const setupSql = readFileSync(join(scriptsDir, '00-setup-migrations.sql'), 'utf-8');
    console.error(setupSql);
    console.error('─'.repeat(60));
    console.error('');
    console.error('Then run: bun run db:migrate');
    process.exit(1);
  }

  const appliedMigrations = await getAppliedMigrations();
  const pendingMigrations = sqlFiles.filter(f => !appliedMigrations.includes(f));

  if (pendingMigrations.length === 0) {
    console.log('✅ All migrations already applied!');
    return;
  }

  console.log('🚀 Running database migrations...\n');
  console.log(`   Found ${pendingMigrations.length} pending migration(s)\n`);

  let failed = false;

  for (const file of pendingMigrations) {
    const filePath = join(scriptsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    const success = await runMigration(file, sql);
    if (!success) {
      failed = true;
      console.log('');
      console.log('💡 To run manually:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log(`   2. Copy contents of scripts/${file}`);
      console.log('   3. Execute the query');
      break; // Stop on first failure
    }
  }

  if (!failed) {
    console.log('\n✨ All migrations complete!');
  }
}

async function runSingleMigration(fileName: string) {
  const scriptsDir = join(process.cwd(), 'scripts');
  const filePath = join(scriptsDir, fileName);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    // Check if migration system is set up
    const isSetup = await checkMigrationSetup();
    if (!isSetup) {
      console.error('❌ Migration system not set up! Run: bun run db:migrate first');
      process.exit(1);
    }

    console.log(`🚀 Running single migration: ${fileName}\n`);

    const success = await runMigration(fileName, sql);
    if (!success) {
      process.exit(1);
    }

    console.log('\n✨ Migration complete!');
  } catch (err) {
    console.error(`❌ Could not read migration file: ${fileName}`);
    process.exit(1);
  }
}

// Main execution
const specificFile = process.argv[2];

if (specificFile) {
  runSingleMigration(specificFile);
} else {
  runAllMigrations();
}
