-- Fix subscription_status check constraint to include all valid values
-- The original constraint was missing 'incomplete' and 'trialing' statuses

-- Drop the old constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_status_check;

-- Add the new constraint with all valid values
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_status_check 
  CHECK (subscription_status IN ('trial', 'trialing', 'active', 'canceled', 'past_due', 'incomplete'));
