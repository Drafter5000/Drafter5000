import { getServerSupabaseSession, getServerSupabaseClient } from "@/lib/supabase-client"
import { getStripeClient } from "@/lib/stripe-client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { new_plan_id } = await request.json()

    if (!["pro", "enterprise"].includes(new_plan_id)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const stripe = getStripeClient()
    const supabase = await getServerSupabaseClient()

    // Get current subscription
    const { data: subscriptionData } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", session.user.id)
      .single()

    if (!subscriptionData?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 })
    }

    // Get new price ID
    const newPriceId =
      new_plan_id === "pro" ? process.env.STRIPE_PRICE_PRO_ID : process.env.STRIPE_PRICE_ENTERPRISE_ID

    if (!newPriceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 })
    }

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id)

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations", // Prorate the difference
    })

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    })
  } catch (error: any) {
    console.error("Plan change error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
