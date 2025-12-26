-- User Stats Table
-- Stores synced statistics from Google Sheets for each user
-- This allows faster dashboard loading and historical tracking

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Article counts from Google Sheets
  articles_generated INTEGER DEFAULT 0,
  articles_sent INTEGER DEFAULT 0,
  articles_draft INTEGER DEFAULT 0,
  articles_in_progress INTEGER DEFAULT 0,
  articles_review INTEGER DEFAULT 0,
  
  -- Topic counts
  total_topics INTEGER DEFAULT 0,
  
  -- Trend data (percentage change from previous period)
  generated_trend_value INTEGER DEFAULT 0,
  generated_trend_positive BOOLEAN DEFAULT true,
  sent_trend_value INTEGER DEFAULT 0,
  sent_trend_positive BOOLEAN DEFAULT true,
  
  -- Sync metadata
  last_synced_at TIMESTAMP,
  sync_source TEXT DEFAULT 'google_sheets',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_synced ON user_stats(last_synced_at DESC);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats" 
  ON user_stats FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all stats" 
  ON user_stats FOR ALL 
  USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS user_stats_updated_at ON user_stats;
CREATE TRIGGER user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_updated_at();
