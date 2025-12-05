-- Migration script: Convert existing onboarding_data to article_styles
-- This preserves all existing user data by creating article_styles records

-- Insert existing onboarding data into article_styles
INSERT INTO article_styles (
  user_id,
  name,
  style_samples,
  subjects,
  email,
  display_name,
  preferred_language,
  delivery_days,
  sheets_config_id,
  is_active,
  created_at,
  updated_at
)
SELECT 
  user_id,
  COALESCE(display_name, 'My Writing Style') as name,
  style_samples,
  subjects,
  email,
  display_name,
  COALESCE(preferred_language, 'en') as preferred_language,
  delivery_days,
  sheets_config_id,
  CASE WHEN completed_at IS NOT NULL THEN true ELSE false END as is_active,
  created_at,
  updated_at
FROM onboarding_data
WHERE NOT EXISTS (
  SELECT 1 FROM article_styles 
  WHERE article_styles.user_id = onboarding_data.user_id
);

-- Note: The onboarding_data table is kept for backward compatibility
-- It can be dropped after verifying the migration was successful
-- DROP TABLE IF EXISTS onboarding_data;
