-- Migration: Add pending_style_data table
-- Purpose: Store pending style data during signup flow (before payment completion)
-- This avoids Stripe metadata 500 character limit for style_samples

-- Create pending_style_data table
CREATE TABLE IF NOT EXISTS pending_style_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    style_samples JSONB NOT NULL DEFAULT '[]',
    subjects JSONB NOT NULL DEFAULT '[]',
    preferred_language VARCHAR(10) DEFAULT 'en',
    delivery_days JSONB NOT NULL DEFAULT '[]',
    job VARCHAR(255),
    display_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_style_data_user_id ON pending_style_data(user_id);

-- Add RLS policies
ALTER TABLE pending_style_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own pending data
CREATE POLICY "Users can view own pending style data"
    ON pending_style_data
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own pending data
CREATE POLICY "Users can insert own pending style data"
    ON pending_style_data
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending data
CREATE POLICY "Users can update own pending style data"
    ON pending_style_data
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own pending data
CREATE POLICY "Users can delete own pending style data"
    ON pending_style_data
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for webhook processing)
CREATE POLICY "Service role full access to pending style data"
    ON pending_style_data
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_pending_style_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pending_style_data_updated_at
    BEFORE UPDATE ON pending_style_data
    FOR EACH ROW
    EXECUTE FUNCTION update_pending_style_data_updated_at();

-- Comment on table
COMMENT ON TABLE pending_style_data IS 'Temporary storage for style data during signup flow, before payment is completed. Data is moved to article_styles after successful payment.';
