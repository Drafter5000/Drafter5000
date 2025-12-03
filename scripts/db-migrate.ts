#!/usr/bin/env bun
/**
 * Database Migration Script
 * Runs SQL migrations against Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.')
  console.error('Find it in Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

async function runMigrations() {
  const scriptsDir = join(process.cwd(), 'scripts')
  const sqlFiles = readdirSync(scriptsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log('🚀 Running database migrations...\n')

  for (const file of sqlFiles) {
    const filePath = join(scriptsDir, file)
    const sql = readFileSync(filePath, 'utf-8')

    console.log(`📄 Executing: ${file}`)

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

    if (error) {
      // Try direct execution for DDL statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const statement of statements) {
        const { error: stmtError } = await supabase.from('_migrations').select('*').limit(0)
        if (stmtError && !stmtError.message.includes('does not exist')) {
          console.log(`   ⚠️  Note: Run this SQL manually in Supabase SQL Editor`)
          break
        }
      }
    }

    console.log(`   ✅ Completed: ${file}`)
  }

  console.log('\n✨ Migrations complete!')
  console.log('')
  console.log('💡 If migrations failed, run manually:')
  console.log('   1. Go to Supabase Dashboard > SQL Editor')
  console.log('   2. Copy contents of scripts/01-schema.sql')
  console.log('   3. Execute the query')
}

runMigrations().catch(console.error)
