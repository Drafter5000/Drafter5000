import { type NextRequest, NextResponse } from 'next/server';
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
 * Creates a new user account and stores pending style data for processing.
 * User must verify email first, then select a plan on /subscribe page.
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

    // Store pending style data in database for processing after subscription
    const { error: pendingStyleError } = await supabaseAdmin.from('pending_style_data').upsert({
      user_id: authData.user.id,
      style_samples,
      subjects,
      preferred_language: preferred_language || 'en',
      delivery_days: delivery_days || [],
      job,
      display_name: name,
      created_at: new Date().toISOString(),
    });

    if (pendingStyleError) {
      console.error('Failed to store pending style data:', pendingStyleError);
      // Continue anyway - we'll try to recover from profile data
    }

    // Return success - user needs to verify email first, then select plan on /subscribe
    return NextResponse.json({
      user_id: authData.user.id,
      message: 'Account created. Please verify your email to continue.',
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
