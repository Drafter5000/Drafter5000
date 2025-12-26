-- Seed Drafter Organization
-- This creates the initial organization for MVP
-- Super admin is created via environment variable during app bootstrap

-- ===========================================
-- CREATE DRAFTER ORGANIZATION
-- ===========================================
INSERT INTO organizations (id, name, slug, settings, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Drafter',
  'drafter',
  '{"is_default": true, "allow_signups": true}',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- Note: Super admin user is created automatically when they first sign up
-- if their email matches SUPER_ADMIN_EMAIL environment variable.
-- See: lib/auth-utils.ts -> handleNewUserSetup()
