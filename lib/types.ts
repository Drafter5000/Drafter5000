export type UserRole = 'free' | 'pro' | 'enterprise';
export type OrgRole = 'super_admin' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trial' | 'trialing' | 'incomplete';
  subscription_plan: UserRole;
  stripe_customer_id: string | null;
  current_organization_id: string | null;
  is_super_admin: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface OrganizationWithRole extends Organization {
  role: OrgRole;
}

export interface OnboardingData {
  user_id: string;
  style_samples: string[]; // 3 article samples
  subjects: string[];
  email: string;
  display_name: string;
  preferred_language: string;
  delivery_days: string[]; // Mon-Sun
  sheets_config_id: string | null;
  sheets_subjects_id: string | null;
  completed_at: string | null;
}

export interface Article {
  id: string;
  user_id: string;
  subject: string;
  status: 'draft' | 'pending' | 'sent' | 'archived';
  content: string | null;
  generated_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  articles_per_month: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  is_visible: boolean; // Controls display on pricing page
  is_highlighted: boolean;
  sort_order: number;
  cta_text: string | null;
  cta_type: 'checkout' | 'email' | 'signup';
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_text: string;
  sort_order: number;
  created_at: string;
}

export interface SubscriptionPlanWithFeatures extends SubscriptionPlan {
  features: PlanFeature[];
}

// ===========================================
// ADMIN DASHBOARD TYPES
// ===========================================

export type AdminAction =
  | 'user.create'
  | 'user.update_role'
  | 'user.deactivate'
  | 'user.reactivate'
  | 'org.create'
  | 'org.update'
  | 'org.deactivate'
  | 'org.reactivate';

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: AdminAction;
  target_type: 'user' | 'organization';
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AdminUserView {
  id: string;
  email: string;
  display_name: string | null;
  role: OrgRole | null;
  organization_id: string | null;
  organization_name: string | null;
  subscription_status: string;
  subscription_plan: string;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminOrgView {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  member_count: number;
  admin_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateUserInput {
  email: string;
  display_name: string;
  password: string;
  role: OrgRole;
  organization_id?: string;
}

export interface CreateOrgInput {
  name: string;
  slug: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
  initial_admin_id?: string;
}

export interface UpdateOrgInput {
  name?: string;
  slug?: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
  is_active?: boolean;
}

export interface AdminSession {
  user_id: string;
  email: string;
  is_super_admin: boolean;
  organization_id: string | null;
  role: OrgRole | null;
}

export interface DashboardMetrics {
  total_users: number;
  total_organizations: number;
  subscriptions_by_plan: Record<string, number>;
  recent_registrations: UserProfile[];
  active_users: number;
}

// ===========================================
// ARTICLE STYLES TYPES
// ===========================================

export interface ArticleStyle {
  id: string;
  user_id: string;
  name: string;
  style_samples: string[];
  subjects: string[];
  email: string | null;
  display_name: string | null;
  preferred_language: string;
  delivery_days: string[];
  sheets_config_id: string | null;
  sheets_row_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleStyleInput {
  user_id: string;
  name: string;
  style_samples: string[];
  subjects: string[];
  email?: string;
  display_name?: string;
  preferred_language?: string;
  delivery_days?: string[];
}

export interface UpdateArticleStyleInput {
  name?: string;
  style_samples?: string[];
  subjects?: string[];
  email?: string;
  display_name?: string;
  preferred_language?: string;
  delivery_days?: string[];
  is_active?: boolean;
}

export interface ArticleWithStyle extends Article {
  style_id: string | null;
  style_name: string | null;
}

// Step-based creation types for wizard flow
export interface ArticleStyleStep1Data {
  style_samples: string[];
}

export interface ArticleStyleStep2Data {
  subjects: string[];
}

export interface ArticleStyleStep3Data {
  name: string;
  email: string;
  display_name: string;
  preferred_language: string;
  delivery_days: string[];
}

export interface ArticleStyleDraft {
  id?: string;
  user_id: string;
  style_samples?: string[];
  subjects?: string[];
  name?: string;
  email?: string;
  display_name?: string;
  preferred_language?: string;
  delivery_days?: string[];
}
