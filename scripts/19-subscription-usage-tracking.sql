-- Add usage tracking fields to subscriptions table
-- This allows tracking article usage per billing period in the database

-- Add usage tracking columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS articles_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS articles_limit INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMP DEFAULT NOW();

-- Create index for usage queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_usage_reset ON subscriptions(usage_reset_at);

-- Function to reset usage at the start of a new billing period
-- This is called by the webhook when subscription renews
CREATE OR REPLACE FUNCTION reset_subscription_usage(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    articles_used = 0,
    usage_reset_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment article usage
CREATE OR REPLACE FUNCTION increment_article_usage(p_user_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  articles_used INTEGER,
  articles_limit INTEGER,
  can_generate BOOLEAN
) AS $$
DECLARE
  v_current_used INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get current usage and limit
  SELECT s.articles_used, s.articles_limit 
  INTO v_current_used, v_limit
  FROM subscriptions s
  WHERE s.user_id = p_user_id;
  
  -- If no subscription found, return failure
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 0, FALSE;
    RETURN;
  END IF;
  
  -- Check if user can generate (hasn't exceeded limit)
  IF v_current_used >= v_limit THEN
    RETURN QUERY SELECT FALSE, v_current_used, v_limit, FALSE;
    RETURN;
  END IF;
  
  -- Increment usage
  UPDATE subscriptions
  SET 
    articles_used = articles_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, v_current_used + 1, v_limit, (v_current_used + 1) < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Comment on columns for documentation
COMMENT ON COLUMN subscriptions.articles_used IS 'Number of articles generated in current billing period';
COMMENT ON COLUMN subscriptions.articles_limit IS 'Maximum articles allowed per billing period (from plan)';
COMMENT ON COLUMN subscriptions.usage_reset_at IS 'Timestamp when usage was last reset (start of billing period)';
