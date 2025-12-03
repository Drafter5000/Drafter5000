import { getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { user_id, email, display_name, preferred_language, delivery_days } =
      await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();

    const { error } = await supabase
      .from('user_profiles')
      .update({
        email,
        display_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (error) throw error;

    // Update onboarding data with new delivery preferences
    await supabase
      .from('onboarding_data')
      .update({
        email,
        display_name,
        preferred_language,
        delivery_days,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
