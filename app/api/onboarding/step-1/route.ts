import { getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, style_samples } = await request.json();

    if (!user_id || !style_samples || style_samples.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();

    // Upsert onboarding data
    const { error } = await supabase.from('onboarding_data').upsert(
      {
        user_id,
        style_samples,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving style samples:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
