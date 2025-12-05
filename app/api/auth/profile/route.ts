import { type NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient, getServerSupabaseSession } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSupabaseSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    console.error('Profile error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
