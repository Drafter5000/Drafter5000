-- Article Styles Table (replaces onboarding_data for style management)
CREATE TABLE IF NOT EXISTS article_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  style_samples TEXT[] DEFAULT '{}',
  subjects TEXT[] DEFAULT '{}',
  email TEXT,
  display_name TEXT,
  preferred_language TEXT DEFAULT 'en',
  delivery_days TEXT[] DEFAULT '{}',
  sheets_config_id TEXT,
  sheets_row_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add style_id column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS style_id UUID REFERENCES article_styles(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_styles_user_id ON article_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_article_styles_created_at ON article_styles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_styles_is_active ON article_styles(is_active);
CREATE INDEX IF NOT EXISTS idx_articles_style_id ON articles(style_id);

-- Enable Row Level Security
ALTER TABLE article_styles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_styles
CREATE POLICY "Users can view their own article styles" 
  ON article_styles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own article styles" 
  ON article_styles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own article styles" 
  ON article_styles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own article styles" 
  ON article_styles FOR DELETE 
  USING (auth.uid() = user_id);
