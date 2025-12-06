-- App Configuration Table
-- Stores application-wide settings that can be managed from admin panel

-- Create app_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add description column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_config' AND column_name = 'description'
  ) THEN
    ALTER TABLE app_config ADD COLUMN description TEXT;
  END IF;
END $$;

-- Insert default configuration values (only if they don't exist)
INSERT INTO app_config (key, value, description) VALUES
  ('site_name', 'Drafter', 'Application name displayed in UI'),
  ('support_email', '', 'Support email address'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('allow_registration', 'true', 'Allow new user registrations'),
  ('require_email_verification', 'true', 'Require email verification for new users'),
  ('max_users_per_org', '50', 'Maximum users per organization'),
  ('trial_enabled', 'false', 'Enable free trial for new subscriptions'),
  ('paywall_trial_days', '7', 'Number of days for free trial')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- Grant permissions
GRANT SELECT ON app_config TO authenticated;
GRANT ALL ON app_config TO service_role;
