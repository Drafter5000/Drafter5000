-- Multi-Tenant Schema for Organizations and Roles
-- Designed for future expansion while starting with single org + super admin

-- ===========================================
-- ORGANIZATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- ORGANIZATION ROLES ENUM
-- ===========================================
DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('super_admin', 'admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- ORGANIZATION MEMBERS (Junction Table)
-- ===========================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES user_profiles(id),
  invited_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ===========================================
-- ADD ORGANIZATION REFERENCE TO USER_PROFILES
-- ===========================================
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- ===========================================
-- ORGANIZATION INVITATIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_org ON user_profiles(current_organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_admin ON user_profiles(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view orgs they belong to
CREATE POLICY "Users can view their organizations" 
  ON organizations FOR SELECT 
  USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Organization Members: Users can view members of their orgs
CREATE POLICY "Users can view org members" 
  ON organization_members FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Admins can manage org members
CREATE POLICY "Admins can insert org members" 
  ON organization_members FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin') 
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "Admins can update org members" 
  ON organization_members FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin') 
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Invitations: Admins can manage invitations
CREATE POLICY "Users can view invitations for their orgs" 
  ON organization_invitations FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin') 
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "Admins can create invitations" 
  ON organization_invitations FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin') 
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_uuid AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user's role in an organization
CREATE OR REPLACE FUNCTION get_user_org_role(user_uuid UUID, org_uuid UUID)
RETURNS org_role AS $$
DECLARE
  user_role org_role;
BEGIN
  SELECT role INTO user_role
  FROM organization_members
  WHERE user_id = user_uuid 
    AND organization_id = org_uuid 
    AND is_active = true;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin access to org
CREATE OR REPLACE FUNCTION has_org_admin_access(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins have access to everything
  IF is_super_admin(user_uuid) THEN
    RETURN true;
  END IF;
  
  -- Check org-level admin role
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = user_uuid 
      AND organization_id = org_uuid 
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGER: Auto-update updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
