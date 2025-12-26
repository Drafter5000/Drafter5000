-- Migration: Add job field to user_profiles
-- Requirements: 6.1

-- Add job column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.job IS 'User occupation/role captured during onboarding signup';
