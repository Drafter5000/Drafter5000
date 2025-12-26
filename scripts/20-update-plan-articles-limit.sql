-- Migration: Update subscription plan articles limit
-- This script updates the articles_per_month for plans and syncs to subscriptions table

-- Update the Pro plan to have 30 articles per month (adjust plan ID as needed)
UPDATE subscription_plans 
SET articles_per_month = 30, updated_at = NOW()
WHERE id = 'pro';

-- Sync the articles_limit in subscriptions table for all users on the Pro plan
UPDATE subscriptions s
SET articles_limit = 30, updated_at = NOW()
FROM user_profiles up
WHERE s.user_id = up.id 
AND up.subscription_plan = 'pro';

-- Verify the changes
SELECT 
  sp.id as plan_id, 
  sp.name as plan_name, 
  sp.articles_per_month,
  COUNT(s.user_id) as subscription_count
FROM subscription_plans sp
LEFT JOIN user_profiles up ON up.subscription_plan = sp.id
LEFT JOIN subscriptions s ON s.user_id = up.id
GROUP BY sp.id, sp.name, sp.articles_per_month
ORDER BY sp.sort_order;
