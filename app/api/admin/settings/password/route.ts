import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from '@/lib/admin-auth';
import { validatePassword } from '@/lib/password-validation';
import { getServerSupabaseClient } from '@/lib/supabase-client';

/**
 * POST /api/admin/settings/password
 * Resets the admin user's password.
 * Requires current password verification and new password validation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { current_password, new_password, confirm_password } = body;

    // Validate required fields
    if (!current_password || !new_password || !confirm_password) {
      return NextResponse.json(
        { error: 'All fields are required: current_password, new_password, confirm_password' },
        { status: 400 }
      );
    }

    // Check passwords match
    if (new_password !== confirm_password) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match' },
        { status: 400 }
      );
    }

    // Validate new password meets requirements
    const validation = validatePassword(new_password);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: validation.errors },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const supabase = await getServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.email,
      password: current_password,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Update password using admin API
    const adminSupabase = getSupabaseAdmin();
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(session.user_id, {
      password: new_password,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
