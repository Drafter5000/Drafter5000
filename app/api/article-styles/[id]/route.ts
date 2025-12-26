import { type NextRequest, NextResponse } from 'next/server';
import {
  getArticleStyle,
  updateArticleStyle,
  deleteArticleStyle,
} from '@/lib/services/article-styles';
import { updateStyleInSheets, deleteStyleFromSheets } from '@/lib/services/article-styles-sync';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import { checkSubscriptionAccess } from '@/lib/subscription-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const style = await getArticleStyle(id, userId);

    if (!style) {
      return NextResponse.json({ error: 'Style not found' }, { status: 404 });
    }

    return NextResponse.json(style);
  } catch (error: unknown) {
    console.error('Error getting article style:', error);
    const message = error instanceof Error ? error.message : 'Failed to get style';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, ...updateData } = body;

    console.log('=== PUT /api/article-styles/[id] ===');
    console.log('Style ID:', id);
    console.log('User ID:', user_id);
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Check subscription status before allowing style update
    const supabase = await getServerSupabaseClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', user_id)
      .single();

    const subscriptionCheck = checkSubscriptionAccess(profile?.subscription_status);
    if (!subscriptionCheck.hasAccess) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: subscriptionCheck.message,
          subscription_status: subscriptionCheck.status,
        },
        { status: 403 }
      );
    }

    // Verify style exists and belongs to user
    const existing = await getArticleStyle(id, user_id);
    if (!existing) {
      return NextResponse.json({ error: 'Style not found' }, { status: 404 });
    }

    const style = await updateArticleStyle(id, user_id, updateData);
    console.log('Style updated in database:', style.id);
    console.log('Updated style subjects count:', style.subjects?.length);
    console.log('Updated style samples count:', style.style_samples?.length);

    // Sync to Google Sheets (blocking - wait for completion before returning)
    // This ensures the dashboard shows updated data immediately after redirect
    console.log('Triggering Google Sheets sync for style:', style.id);
    console.log('Style data for sync:', {
      email: style.email,
      display_name: style.display_name,
      preferred_language: style.preferred_language,
      delivery_days: style.delivery_days,
      subjects_count: style.subjects?.length,
      samples_count: style.style_samples?.length,
    });

    try {
      const syncResult = await updateStyleInSheets(style);
      if (syncResult.success) {
        console.log('Google Sheets sync completed successfully for style:', style.id);
      } else {
        console.error('Google Sheets sync failed:', syncResult.error);
      }
    } catch (err) {
      console.error('Failed to sync update to sheets:', err);
      // Don't fail the request if sheets sync fails - data is saved in DB
    }

    return NextResponse.json(style);
  } catch (error: unknown) {
    console.error('Error updating article style:', error);
    const message = error instanceof Error ? error.message : 'Failed to update style';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Check subscription status before allowing style deletion
    const supabase = await getServerSupabaseClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    const subscriptionCheck = checkSubscriptionAccess(profile?.subscription_status);
    if (!subscriptionCheck.hasAccess) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: subscriptionCheck.message,
          subscription_status: subscriptionCheck.status,
        },
        { status: 403 }
      );
    }

    // Verify style exists and belongs to user
    const existing = await getArticleStyle(id, userId);
    if (!existing) {
      return NextResponse.json({ error: 'Style not found' }, { status: 404 });
    }

    await deleteArticleStyle(id, userId);

    // Sync deletion to Google Sheets (non-blocking)
    deleteStyleFromSheets(id).catch(err => {
      console.error('Failed to sync deletion to sheets:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting article style:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete style';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
