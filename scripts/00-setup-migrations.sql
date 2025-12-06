-- Migration Helper Function
-- This function allows running arbitrary SQL from the application
-- Run this ONCE manually in Supabase SQL Editor before using db:migrate

-- Enable required extensions (in extensions schema for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users (service role)
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);
