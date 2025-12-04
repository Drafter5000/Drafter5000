import { getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();

    // Fetch from user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Fetch from onboarding_data for delivery preferences
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding_data')
      .select('preferred_language, delivery_days, display_name, email')
      .eq('user_id', userId)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      throw onboardingError;
    }

    return NextResponse.json({
      display_name: onboardingData?.display_name || profileData?.display_name || null,
      email: onboardingData?.email || profileData?.email || null,
      preferred_language: onboardingData?.preferred_language || 'en',
      delivery_days: onboardingData?.delivery_days || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings';
    console.error('Settings fetch error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
