import { type NextRequest, NextResponse } from 'next/server';
import { saveDraft, getDraft } from '@/lib/services/article-styles';

export async function POST(request: NextRequest) {
  try {
    const { user_id, subjects, draft_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!subjects || !Array.isArray(subjects)) {
      return NextResponse.json({ error: 'subjects must be an array' }, { status: 400 });
    }

    const validSubjects = subjects.filter((s: string) => s && s.trim().length > 0);
    if (validSubjects.length === 0) {
      return NextResponse.json({ error: 'At least one subject is required' }, { status: 400 });
    }

    if (!draft_id) {
      return NextResponse.json(
        { error: 'draft_id is required. Complete step 1 first.' },
        { status: 400 }
      );
    }

    await saveDraft({
      id: draft_id,
      user_id,
      subjects: validSubjects,
    });

    return NextResponse.json({ success: true, draft_id });
  } catch (error: unknown) {
    console.error('Error saving step 2:', error);
    const message = error instanceof Error ? error.message : 'Failed to save subjects';
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
      subjects: draft?.subjects || [],
      draft_id: draft?.id || null,
    });
  } catch (error: unknown) {
    console.error('Error getting step 2 data:', error);
    const message = error instanceof Error ? error.message : 'Failed to get data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
