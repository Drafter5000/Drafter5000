import { type NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { setupSuperAdmin, setupNewUserOrganization } from '@/lib/organization-utils';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if email already exists in user_profiles
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

    const supabase = await getServerSupabaseClient();

    // Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    console.log('authData:', authData);

    if (signUpError) throw signUpError;

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    // Check if this user should be super admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    const isSuperAdmin = superAdminEmail && email.toLowerCase() === superAdminEmail;

    // Create user profile using admin client to bypass RLS
    // This is necessary because auth.uid() is not available immediately after signup
    // Set subscription_status to 'incomplete' - user must complete Stripe checkout before accessing the app
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: authData.user.id,
      email,
      display_name: name,
      subscription_status: 'incomplete',
      subscription_plan: 'free',
      current_organization_id: DEFAULT_ORG_ID,
      is_super_admin: isSuperAdmin,
    });

    if (profileError) {
      // Handle duplicate key constraint error as a fallback
      if (profileError.code === '23505') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw profileError;
    }

    // Setup organization membership
    if (isSuperAdmin) {
      await setupSuperAdmin(authData.user.id);
      console.log(`Super admin created: ${email}`);
    } else {
      await setupNewUserOrganization(authData.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle Supabase Auth error for existing user
    if (error.message?.includes('User already registered')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
