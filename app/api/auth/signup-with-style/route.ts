import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { setupNewUserOrganization } from '@/lib/organization-utils';
import { UserRoleType } from '@/lib/types';
import { mapToDbFields } from '@/lib/role-config';
import { validateSignupForm } from '@/lib/onboarding-validation';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const CUSTOMER_DB_FIELDS = mapToDbFields(UserRoleType.CUSTOMER);

/**
 * POST /api/auth/signup-with-style
 *
 * Creates a new user account without email verification and stores pending style data.
 * After signup, user is automatically signed in and redirected to subscribe page.
 * Style data is activated after successful payment via webhook.
 *
 * Flow:
 * 1. Create account (email_confirm: true - no verification needed)
 * 2. Save user profile immediately
 * 3. Store style data in pending_style_data table
 * 4. Sign in user to establish session
 * 5. Redirect to subscribe page
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6
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
    } = body;

    // Validate signup form
    const validation = validateSignupForm({ name, email, password, confirmPassword, job });
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          fields: validation.errors,
          retry: true,
        },
        { status: 400 }
      );
    }

    // Validate style data
    if (!style_samples || style_samples.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one style sample is required',
          retry: true,
        },
        { status: 400 }
      );
    }
    if (!subjects || subjects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one topic is required',
          retry: true,
        },
        { status: 400 }
      );
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
        {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
          retry: false,
        },
        { status: 409 }
      );
    }

    // Create user account with email_confirm: true to skip email verification
    // Requirements: 4.3
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        display_name: name,
      },
    });

    if (signUpError) {
      console.error('Auth creation error:', signUpError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create account. Please try again.',
          retry: true,
        },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user account. Please try again.',
          retry: true,
        },
        { status: 400 }
      );
    }

    // Create user profile with job field immediately
    // Requirements: 4.4
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
      console.error('Profile creation error:', profileError);
      if (profileError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email already exists. Please sign in instead.',
            retry: false,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save profile. Please try again.',
          retry: true,
        },
        { status: 500 }
      );
    }

    // Setup organization membership
    try {
      await setupNewUserOrganization(authData.user.id);
    } catch (orgError) {
      console.error('Organization setup error:', orgError);
      // Don't fail signup for org setup issues
    }

    // Store style data in pending_style_data table
    // This will be activated after payment via webhook
    // Requirements: 4.5
    const { error: pendingStyleError } = await supabaseAdmin.from('pending_style_data').upsert(
      {
        user_id: authData.user.id,
        display_name: name,
        style_samples: style_samples,
        subjects: subjects,
        preferred_language: preferred_language || 'en',
        delivery_days: delivery_days || [],
        job: job,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (pendingStyleError) {
      console.error('Failed to save pending style data:', pendingStyleError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save style data. Please try again.',
          retry: true,
        },
        { status: 500 }
      );
    }

    // Sign in the user to establish a session
    // This allows automatic redirect to subscribe page without requiring login
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Auto sign-in error:', signInError);
      // Don't fail the signup, just log the error
      // User can still manually log in
    }

    // Return success with redirect URL to subscribe page
    // Requirements: 4.6
    return NextResponse.json({
      success: true,
      user_id: authData.user.id,
      redirect_url: '/subscribe',
      message: 'Account created successfully. Please select a plan to continue.',
    });
  } catch (error: unknown) {
    console.error('Signup with style error:', error);

    if (error instanceof Error && error.message?.includes('User already registered')) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
          retry: false,
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to create account';
    return NextResponse.json(
      {
        success: false,
        error: message,
        retry: true,
      },
      { status: 500 }
    );
  }
}
