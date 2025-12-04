import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-client';

export async function POST() {
  try {
    const supabase = await getServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
