export type UserRole = "free" | "pro" | "enterprise"

export interface UserProfile {
  id: string
  email: string
  display_name: string
  created_at: string
  updated_at: string
  subscription_status: "active" | "canceled" | "past_due" | "trial"
  subscription_plan: UserRole
  stripe_customer_id: string | null
}

export interface OnboardingData {
  user_id: string
  style_samples: string[] // 3 article samples
  subjects: string[]
  email: string
  display_name: string
  preferred_language: string
  delivery_days: string[] // Mon-Sun
  sheets_config_id: string | null
  sheets_subjects_id: string | null
  completed_at: string | null
}

export interface Article {
  id: string
  user_id: string
  subject: string
  status: "draft" | "pending" | "sent" | "archived"
  content: string | null
  generated_at: string | null
  sent_at: string | null
  created_at: string
}

export interface SubscriptionPlan {
  id: "free" | "pro" | "enterprise"
  name: string
  price: number
  articles_per_month: number
  features: string[]
}
