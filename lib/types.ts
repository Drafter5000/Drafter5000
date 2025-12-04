export type UserRole = 'free' | 'pro' | 'enterprise';
export type OrgRole = 'super_admin' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trial';
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
