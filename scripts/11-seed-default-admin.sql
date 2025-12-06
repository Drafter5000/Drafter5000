-- Seed Default Admin User
-- Creates the default admin user for the Drafter organization
-- Email: admin@drafter.com
-- Password: Admin@123 (should be changed after first login)
-- 
-- NOTE: This script creates the user_profile entry only.
-- The auth.users entry must be created via Supabase Admin API
-- using the seed-admin-user.ts script.

-- ===========================================
-- CREATE DEFAULT ADMIN USER PROFILE
-- ===========================================

-- First, ensure the default organization exists
INSERT INTO organizations (id, name, slug, settings, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Drafter',
  'drafter',
  '{"is_default": true, "allow_signups": true}',
  true
)
ON CONFLICT (id) DO NOTHING;

-- The user_profile will be created by the seed-admin-user.ts script
-- after creating the auth user, as we need the auth user ID.

-- ===========================================
-- HELPER: Add admin to organization after user is created
-- ===========================================
-- This function can be called after the admin user is created
-- to add them to the default organization

CREATE OR REPLACE FUNCTION add_admin_to_default_org(admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Add admin to default organization as super_admin
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_active,
    joined_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    admin_user_id,
    'super_admin',
    true,
    NOW()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    updated_at = NOW();
    
  -- Update user profile to set current organization
  UPDATE user_profiles
  SET current_organization_id = '00000000-0000-0000-0000-000000000001',
      updated_at = NOW()
  WHERE id = admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
