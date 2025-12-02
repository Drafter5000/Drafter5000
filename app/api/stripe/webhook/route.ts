import { getStripeClient } from "@/lib/stripe-client"
import { getServerSupabaseClient } from "@/lib/supabase-client"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const stripe = getStripeClient()
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await getServerSupabaseClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const customerId = session.customer
        const subscriptionId = session.subscription

        if (!subscriptionId) break

        // Get subscription details - the subscription object is directly in event.data.object for subscription events
        // For checkout.session.completed, we get it from the session
        const subscription = event.data.object.subscription
          ? event.data.object
          : await stripe.subscriptions.retrieve(subscriptionId as string)

        // For checkout sessions, subscription details might be in the session itself
        // Let's use the subscription from webhook event if available
        const subData = subscription as any

        // Determine plan from price
        let plan = "free"
        const priceId = subData.items?.data?.[0]?.price?.id || subData.plan?.id
        if (priceId === process.env.STRIPE_PRICE_PRO_ID) plan = "pro"
        if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_ID) plan = "enterprise"

        // Update user profile
        await supabase
          .from("user_profiles")
          .update({
            subscription_status: subData.status || "active",
            subscription_plan: plan,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId as string)

        // Create or update subscription record
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId as string)
          .single()

        if (profile) {
          const periodStart = subData.current_period_start || Math.floor(Date.now() / 1000)
          const periodEnd = subData.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

          await supabase.from("subscriptions").upsert({
            user_id: profile.id,
            stripe_subscription_id: subscriptionId as string,
            stripe_price_id: priceId || "",
            plan,
            status: subData.status || "active",
            current_period_start: new Date(periodStart * 1000).toISOString(),
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
        }

        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Determine plan from price
        let plan = "free"
        const priceId = subscription.items?.data?.[0]?.price?.id
        if (priceId === process.env.STRIPE_PRICE_PRO_ID) plan = "pro"
        if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_ID) plan = "enterprise"

        await supabase
          .from("user_profiles")
          .update({
            subscription_status: subscription.status,
            subscription_plan: plan,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId as string)

        // Update subscription record
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId as string)
          .single()

        if (profile && subscription.current_period_start && subscription.current_period_end) {
          await supabase.from("subscriptions").upsert({
            user_id: profile.id,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId || "",
            plan,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const customerId = subscription.customer

        await supabase
          .from("user_profiles")
          .update({
            subscription_status: "canceled",
            subscription_plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId as string)

        // Update subscription record
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId as string)
          .single()

        if (profile) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", profile.id)
        }

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        const customerId = invoice.customer

        // Update subscription status to active on successful payment
        await supabase
          .from("user_profiles")
          .update({
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId as string)

        console.log("Payment succeeded for:", customerId)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const customerId = invoice.customer

        // Update subscription status to past_due
        await supabase
          .from("user_profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId as string)

        console.log("Payment failed for:", customerId)
        break
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object
        // Send email notification about trial ending
        console.log("Trial ending soon for subscription:", subscription.id)
        break
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
