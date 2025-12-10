import { type NextRequest, NextResponse } from 'next/server';
import { generateTopicSuggestions } from '@/lib/services/openai';
import { getDraft } from '@/lib/services/article-styles';

export async function POST(request: NextRequest) {
  try {
    const { user_id, existing_topics = [], style_samples } = await request.json();

    let samplesToUse: string[] = [];

    // If style_samples are provided directly (anonymous flow), use them
    if (style_samples && Array.isArray(style_samples) && style_samples.length > 0) {
      samplesToUse = style_samples;
    } else if (user_id) {
      // Otherwise, get from database using user_id (authenticated flow)
      const draft = await getDraft(user_id);

      if (!draft || !draft.style_samples || draft.style_samples.length === 0) {
        return NextResponse.json(
          { error: 'No style samples found. Please complete step 1 first.' },
          { status: 400 }
        );
      }
      samplesToUse = draft.style_samples;
    } else {
      return NextResponse.json(
        { error: 'Either user_id or style_samples is required' },
        { status: 400 }
      );
    }

    // Generate AI suggestions based on style samples
    const suggestions = await generateTopicSuggestions(samplesToUse, existing_topics, 8);

    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    console.error('Error generating AI suggestions:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate suggestions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
