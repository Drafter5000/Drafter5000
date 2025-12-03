import { getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, subjects } = await request.json();

    if (!user_id || !subjects || subjects.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();

    const { error } = await supabase.from('onboarding_data').upsert(
      {
        user_id,
        subjects,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving subjects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
