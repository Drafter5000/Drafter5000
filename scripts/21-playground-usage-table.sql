-- Playground Usage Tracking Table
-- Stores token usage statistics for AI playground requests

-- Create playground_usage table
CREATE TABLE IF NOT EXISTS playground_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_playground_usage_provider ON playground_usage(provider);
CREATE INDEX IF NOT EXISTS idx_playground_usage_created_at ON playground_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_playground_usage_provider_created ON playground_usage(provider, created_at);

-- Grant permissions
GRANT SELECT, INSERT ON playground_usage TO authenticated;
GRANT ALL ON playground_usage TO service_role;
