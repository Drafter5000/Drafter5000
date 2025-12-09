import { type NextRequest, NextResponse } from 'next/server';
import { generateTopicSuggestions } from '@/lib/services/openai';

/**
 * POST /api/ai/suggestions/anonymous
 *
 * Generate AI topic suggestions for anonymous users.
 * Accepts style_samples directly from the request body instead of fetching from database.
 */
export async function POST(request: NextRequest) {
  try {
    const { style_samples, existing_topics = [] } = await request.json();

    if (!style_samples || !Array.isArray(style_samples) || style_samples.length === 0) {
      return NextResponse.json(
        { error: 'style_samples is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate that style_samples contains non-empty strings
    const validSamples = style_samples.filter(
      (s: unknown) => typeof s === 'string' && s.trim().length > 0
    );

    if (validSamples.length === 0) {
      return NextResponse.json(
        { error: 'style_samples must contain at least one non-empty string' },
        { status: 400 }
      );
    }

    // Generate AI suggestions based on style samples
    const suggestions = await generateTopicSuggestions(validSamples, existing_topics, 8);

    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    console.error('Error generating AI suggestions:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate suggestions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
