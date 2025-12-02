import { getServerSupabaseSession, getServerSupabaseClient } from "@/lib/supabase-client"
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-client"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await getServerSupabaseClient()

    // Get user's current plan
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_plan")
      .eq("id", session.user.id)
      .single()

    const plan = profile?.subscription_plan || "free"
    const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]

    // Get current month's article count
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: articlesUsed } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .gte("created_at", startOfMonth.toISOString())

    return NextResponse.json({
      plan,
      articles_used: articlesUsed || 0,
      articles_limit: planDetails.articles_per_month,
      percentage_used: Math.round(((articlesUsed || 0) / planDetails.articles_per_month) * 100),
      can_generate: (articlesUsed || 0) < planDetails.articles_per_month,
    })
  } catch (error: any) {
    console.error("Usage fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
