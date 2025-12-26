-- Subscription History Table
-- Tracks all subscription periods for audit and history purposes
-- This ensures old subscription data is preserved when renewals occur

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL,
  stripe_price_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  amount_paid_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  invoice_id TEXT,
  event_type TEXT NOT NULL, -- 'created', 'renewed', 'upgraded', 'downgraded', 'canceled'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_sub_id ON subscription_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription history" 
  ON subscription_history FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can insert (for webhooks)
CREATE POLICY "Service role can insert subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (true);
