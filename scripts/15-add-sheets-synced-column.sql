-- Add sheets_synced column to article_styles table
-- This flag prevents duplicate Google Sheets syncs when multiple API endpoints
-- (webhook, activate-style, step-3) try to sync the same style

ALTER TABLE article_styles 
ADD COLUMN IF NOT EXISTS sheets_synced BOOLEAN DEFAULT false;

-- Create index for efficient querying of unsynced styles
CREATE INDEX IF NOT EXISTS idx_article_styles_sheets_synced ON article_styles(sheets_synced);

-- Update existing records to mark them as synced (assuming they were already synced)
-- This prevents re-syncing existing data
UPDATE article_styles 
SET sheets_synced = true 
WHERE sheets_config_id IS NOT NULL OR sheets_row_id IS NOT NULL;
