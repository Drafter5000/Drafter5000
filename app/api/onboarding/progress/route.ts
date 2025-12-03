import { getServerSupabaseClient } from '@/lib/supabase-client'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = await getServerSupabaseClient()

    const { data, error } = await supabase
      .from('onboarding_data')
      .select('style_samples, subjects, delivery_days, completed_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      // No data found is not an error, return empty progress
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          style_samples: [],
          subjects: [],
          delivery_days: [],
          completed_at: null,
        })
      }
      throw error
    }

    return NextResponse.json({
      style_samples: data.style_samples || [],
      subjects: data.subjects || [],
      delivery_days: data.delivery_days || [],
      completed_at: data.completed_at,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch progress'
    console.error('Error fetching onboarding progress:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
