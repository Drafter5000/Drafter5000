-- Subscription Plans Table (Dynamic pricing from database)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  articles_per_month INTEGER NOT NULL,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true, -- Controls display on pricing page
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cta_text TEXT,
  cta_type TEXT DEFAULT 'checkout' CHECK (cta_type IN ('checkout', 'email', 'signup')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plan Features Table (Features linked to plans)
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_visible ON subscription_plans(is_visible);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_sort_order ON plan_features(sort_order);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Plans are publicly readable (for pricing page)
-- Drop existing policies first to allow re-running this script
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Anyone can view plan features" ON plan_features;

CREATE POLICY "Anyone can view active subscription plans" 
  ON subscription_plans FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Anyone can view plan features" 
  ON plan_features FOR SELECT 
  USING (true);

-- Update user_profiles to allow dynamic plan values
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_subscription_plan_check;

-- Add foreign key constraint to link user subscription_plan to subscription_plans table
-- Note: This is optional and depends on whether you want strict referential integrity
-- ALTER TABLE user_profiles 
--   ADD CONSTRAINT fk_user_subscription_plan 
--   FOREIGN KEY (subscription_plan) REFERENCES subscription_plans(id);
