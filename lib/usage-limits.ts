import { getServerSupabaseClient } from "./supabase-client"
import { SUBSCRIPTION_PLANS } from "./stripe-client"

export async function checkUsageLimit(userId: string): Promise<{
  canGenerate: boolean
  articlesUsed: number
  articlesLimit: number
  plan: string
}> {
  const supabase = await getServerSupabaseClient()

  // Get user's current plan
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_plan, subscription_status")
    .eq("id", userId)
    .single()

  const plan = profile?.subscription_plan || "free"
  const status = profile?.subscription_status || "trial"

  // Block if subscription is past_due or canceled
  if (status === "past_due" || status === "canceled") {
    return {
      canGenerate: false,
      articlesUsed: 0,
      articlesLimit: 0,
      plan,
    }
  }

  const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]

  // Get current month's article count
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: articlesUsed } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString())

  const used = articlesUsed || 0
  const limit = planDetails.articles_per_month

  return {
    canGenerate: used < limit,
    articlesUsed: used,
    articlesLimit: limit,
    plan,
  }
}

export async function incrementUsage(userId: string, articleId: string): Promise<void> {
  // This is called after article generation
  // The article is already created, so we just need to verify it's counted
  const supabase = await getServerSupabaseClient()

  await supabase
    .from("articles")
    .update({
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId)
    .eq("user_id", userId)
}
