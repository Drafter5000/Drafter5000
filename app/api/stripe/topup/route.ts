import { getServerSupabaseUser, getServerSupabaseClient } from '@/lib/supabase-client';
import { getStripeClient } from '@/lib/stripe-client';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/stripe/topup
 * Create a checkout session for purchasing additional articles (one-time payment)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articles_count } = await request.json();

    // Validate articles count
    const validCounts = [10, 25, 50];
    if (!validCounts.includes(articles_count)) {
      return NextResponse.json(
        { error: 'Invalid articles count. Choose 10, 25, or 50.' },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabaseClient();
    const stripe = getStripeClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email, display_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Pricing per article pack (in cents)
    const pricing: Record<number, { amount: number; name: string }> = {
      10: { amount: 999, name: '10 Additional Articles' },
      25: { amount: 1999, name: '25 Additional Articles' },
      50: { amount: 3499, name: '50 Additional Articles' },
    };

    const pack = pricing[articles_count];

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email,
        name: profile.display_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pack.name,
              description: `Add ${articles_count} extra articles to your monthly limit`,
            },
            unit_amount: pack.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        type: 'article_topup',
        articles_count: articles_count.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?topup=success&articles=${articles_count}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?topup=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Top-up checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
