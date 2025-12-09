import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripeClient } from '@/lib/stripe-client';
import { setupNewUserOrganization } from '@/lib/organization-utils';
import { UserRoleType } from '@/lib/types';
import { mapToDbFields } from '@/lib/role-config';
import { getPlanById } from '@/lib/plan-utils';
import { validateSignupForm } from '@/lib/onboarding-validation';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const CUSTOMER_DB_FIELDS = mapToDbFields(UserRoleType.CUSTOMER);

/**
 * POST /api/auth/signup-with-style
 *
 * Creates a new user account and stores pending style data for processing
 * after successful payment. Returns a Stripe checkout URL.
 *
 * Requirements: 4.3, 4.4
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      confirmPassword,
      job,
      style_samples,
      subjects,
      preferred_language,
      delivery_days,
      plan_id,
    } = body;

    // Validate signup form
    const validation = validateSignupForm({ name, email, password, confirmPassword, job });
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', fields: validation.errors },
        { status: 400 }
      );
    }

    // Validate style data
    if (!style_samples || style_samples.length === 0) {
      return NextResponse.json({ error: 'At least one style sample is required' }, { status: 400 });
    }
    if (!subjects || subjects.length === 0) {
      return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if email already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user account
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        display_name: name,
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    // Send verification email
    await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    // Create user profile with job field
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: authData.user.id,
      email,
      display_name: name,
      subscription_status: 'incomplete',
      subscription_plan: 'free',
      current_organization_id: DEFAULT_ORG_ID,
      is_super_admin: CUSTOMER_DB_FIELDS.isSuperAdmin,
      job,
    });

    if (profileError) {
      if (profileError.code === '23505') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw profileError;
    }

    // Setup organization membership
    await setupNewUserOrganization(authData.user.id);

    // Get plan for checkout
    const selectedPlanId = plan_id || process.env.DEFAULT_PLAN_ID || 'pro';
    const plan = await getPlanById(selectedPlanId);

    if (!plan || plan.price_cents === 0) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Create Stripe customer
    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { user_id: authData.user.id },
    });

    // Update profile with Stripe customer ID
    await supabaseAdmin
      .from('user_profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', authData.user.id);

    // Prepare pending style data for Stripe metadata
    const pendingStyleData = {
      style_samples: JSON.stringify(style_samples),
      subjects: JSON.stringify(subjects),
      preferred_language: preferred_language || 'en',
      delivery_days: JSON.stringify(delivery_days || []),
      job,
      display_name: name,
    };

    // Ensure Stripe price exists
    let priceId = plan.stripe_price_id;
    if (!priceId) {
      // Create product and price if not exists
      let productId = plan.stripe_product_id;
      if (!productId) {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description || undefined,
          metadata: { plan_id: plan.id },
        });
        productId = product.id;
        await supabaseAdmin
          .from('subscription_plans')
          .update({ stripe_product_id: productId })
          .eq('id', plan.id);
      }

      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.price_cents,
        currency: plan.currency.toLowerCase(),
        recurring: { interval: 'month' },
        metadata: { plan_id: plan.id },
      });
      priceId = price.id;
      await supabaseAdmin
        .from('subscription_plans')
        .update({ stripe_price_id: priceId })
        .eq('id', plan.id);
    }

    // Create Stripe checkout session with pending style data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          user_id: authData.user.id,
          plan_id: plan.id,
          ...pendingStyleData,
        },
      },
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${baseUrl}/dashboard?payment_success=true`,
      cancel_url: `${baseUrl}/articles/generate/step-3?cancelled=true`,
      metadata: {
        user_id: authData.user.id,
        plan_id: plan.id,
        pending_style: 'true',
        ...pendingStyleData,
      },
    });

    return NextResponse.json({
      user_id: authData.user.id,
      checkout_url: checkoutSession.url,
    });
  } catch (error: unknown) {
    console.error('Signup with style error:', error);

    if (error instanceof Error && error.message?.includes('User already registered')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to create account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
