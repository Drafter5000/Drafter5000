-- Migration: Add is_visible column to subscription_plans table
-- This column controls whether a plan is displayed on the pricing page

-- Add the is_visible column if it doesn't exist
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_visible ON subscription_plans(is_visible);

-- Update existing plans to be visible by default
UPDATE subscription_plans SET is_visible = true WHERE is_visible IS NULL;
