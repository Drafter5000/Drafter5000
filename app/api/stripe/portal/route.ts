import { getServerSupabaseSession } from "@/lib/supabase-client"
import { getServerSupabaseClient } from "@/lib/supabase-client"
import { getStripeClient } from "@/lib/stripe-client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stripe = getStripeClient()
    const supabase = await getServerSupabaseClient()

    // Get user's Stripe customer ID
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", session.user.id)
      .single()

    if (!profileData?.stripe_customer_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profileData.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error("Portal session error:", error)
    return NextResponse.json({ error: error.message || "Failed to create portal session" }, { status: 500 })
  }
}
