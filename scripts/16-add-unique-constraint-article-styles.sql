-- Add unique constraint on user_id for article_styles table
-- This prevents duplicate article_styles records for the same user
-- which can happen due to race conditions between webhook and activate-style API

-- First, clean up any existing duplicates (keep the most recent one)
WITH duplicates AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM article_styles
)
DELETE FROM article_styles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE article_styles
ADD CONSTRAINT article_styles_user_id_unique UNIQUE (user_id);

-- Note: If you want to allow multiple styles per user in the future,
-- you can drop this constraint with:
-- ALTER TABLE article_styles DROP CONSTRAINT article_styles_user_id_unique;
