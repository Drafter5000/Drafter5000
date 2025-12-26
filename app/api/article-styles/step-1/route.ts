import { type NextRequest, NextResponse } from 'next/server';
import { saveDraft, getDraft } from '@/lib/services/article-styles';

export async function POST(request: NextRequest) {
  try {
    const { user_id, style_samples, draft_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!style_samples || !Array.isArray(style_samples)) {
      return NextResponse.json({ error: 'style_samples must be an array' }, { status: 400 });
    }

    const validSamples = style_samples.filter((s: string) => s && s.trim().length > 0);
    if (validSamples.length === 0) {
      return NextResponse.json({ error: 'At least one style sample is required' }, { status: 400 });
    }

    const draftId = await saveDraft({
      id: draft_id,
      user_id,
      style_samples: validSamples,
    });

    return NextResponse.json({ success: true, draft_id: draftId });
  } catch (error: unknown) {
    console.error('Error saving step 1:', error);
    const message = error instanceof Error ? error.message : 'Failed to save style samples';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const draft = await getDraft(userId);
    return NextResponse.json({
      style_samples: draft?.style_samples || [],
      draft_id: draft?.id || null,
    });
  } catch (error: unknown) {
    console.error('Error getting step 1 data:', error);
    const message = error instanceof Error ? error.message : 'Failed to get data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
