import { type NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { executePlayground, isPlaygroundError } from '@/lib/services/playground';
import { recordUsage } from '@/lib/services/playground-usage';
import type { PlaygroundRequest } from '@/lib/types/llm-providers';

/**
 * POST /api/admin/playground
 * Execute a playground request against an LLM provider
 */
export async function POST(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: PlaygroundRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { provider, model, systemPrompt, userPrompt, temperature, maxTokens } = body;

    // Validate required fields
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }
    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }
    if (!systemPrompt || systemPrompt.trim().length === 0) {
      return NextResponse.json({ error: 'System prompt is required' }, { status: 400 });
    }
    if (!userPrompt || userPrompt.trim().length === 0) {
      return NextResponse.json({ error: 'User prompt is required' }, { status: 400 });
    }

    // Execute playground request
    const result = await executePlayground({
      provider,
      model,
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
    });

    // Check for errors
    if (isPlaygroundError(result)) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          retryable: result.retryable,
        },
        { status: 400 }
      );
    }

    // Record usage (async, don't wait)
    recordUsage(result).catch(err => {
      console.error('Failed to record usage:', err);
    });

    return NextResponse.json({
      success: true,
      response: result,
    });
  } catch (error: unknown) {
    console.error('Error executing playground:', error);
    const message = error instanceof Error ? error.message : 'Failed to execute playground';
    return NextResponse.json({ error: message, retryable: true }, { status: 500 });
  }
}
