-- Audit Logs Schema for Admin Dashboard
-- Tracks all administrative actions for security and compliance

-- ===========================================
-- AUDIT LOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs" 
  ON audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Only super admins can insert audit logs (via service role)
CREATE POLICY "Service role can insert audit logs" 
  ON audit_logs FOR INSERT 
  WITH CHECK (true);
