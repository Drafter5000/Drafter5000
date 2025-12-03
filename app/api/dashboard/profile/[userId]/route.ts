import { getServerSupabaseClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const supabase = await getServerSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('[API] Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
