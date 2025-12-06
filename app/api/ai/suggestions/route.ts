import { type NextRequest, NextResponse } from 'next/server';
import { generateTopicSuggestions } from '@/lib/services/openai';
import { getDraft } from '@/lib/services/article-styles';

export async function POST(request: NextRequest) {
  try {
    const { user_id, existing_topics = [] } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Get the user's draft to access style samples
    const draft = await getDraft(user_id);

    if (!draft || !draft.style_samples || draft.style_samples.length === 0) {
      return NextResponse.json(
        { error: 'No style samples found. Please complete step 1 first.' },
        { status: 400 }
      );
    }

    // Generate AI suggestions based on style samples
    const suggestions = await generateTopicSuggestions(draft.style_samples, existing_topics, 8);

    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    console.error('Error generating AI suggestions:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate suggestions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
