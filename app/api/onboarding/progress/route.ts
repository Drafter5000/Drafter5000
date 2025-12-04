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

    // Fetch onboarding data
    const { data, error } = await supabase
      .from('onboarding_data')
      .select(
        'style_samples, subjects, delivery_days, completed_at, display_name, email, preferred_language'
      )
      .eq('user_id', userId)
      .single();

    // Also fetch user profile for display_name fallback (set during signup)
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();

    if (error) {
      // No onboarding data found - return profile data as fallback
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          style_samples: [],
          subjects: [],
          delivery_days: [],
          completed_at: null,
          display_name: profileData?.display_name || null,
          email: profileData?.email || null,
          preferred_language: null,
        });
      }
      throw error;
    }

    return NextResponse.json({
      style_samples: data.style_samples || [],
      subjects: data.subjects || [],
      delivery_days: data.delivery_days || [],
      completed_at: data.completed_at,
      // Use onboarding display_name first, fall back to profile display_name
      display_name: data.display_name || profileData?.display_name || null,
      email: data.email || profileData?.email || null,
      preferred_language: data.preferred_language || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch progress';
    console.error('Error fetching onboarding progress:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
