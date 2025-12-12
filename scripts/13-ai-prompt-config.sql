-- AI Prompt Configuration
-- Adds default AI prompts for topic generation to app_config table

-- Insert default AI prompt configuration values (only if they don't exist)
INSERT INTO app_config (key, value, description) VALUES
  ('ai_system_prompt', 'You''re a LinkedIn topic drafter. Your job is to act as a {{job_title}}, look at the topic ideas already drafted and generate {{count}} more like it that are different enough to be novel.

Each topic should be:
- Specific and actionable
- Written as a compelling LinkedIn post title
- Different from the existing topics but in a similar professional domain
- Formatted like: "Why [Problem/Observation]—And [Solution/Insight]"

Return ONLY a JSON array of topic strings, nothing else.', 'AI system prompt for topic generation with dynamic variables: {{job_title}}, {{count}}, {{existing_topics}}, {{style_samples}}'),
  ('ai_user_prompt', 'Here are the existing topic ideas:
{{existing_topics}}

Generate {{count}} new topic ideas that are different but related to these themes.

Return only a JSON array of {{count}} topic strings.', 'AI user prompt for topic generation with dynamic variables')
ON CONFLICT (key) DO NOTHING;
