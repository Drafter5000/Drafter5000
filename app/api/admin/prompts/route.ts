import { type NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import {
  getAIConfig,
  saveAIConfig,
  resetAIConfig,
  DEFAULT_AI_CONFIG,
  SUPPORTED_VARIABLES,
  VARIABLE_DESCRIPTIONS,
  SAMPLE_VARIABLES,
  type AIConfig,
} from '@/lib/services/prompt-config';

/**
 * GET /api/admin/prompts
 * Retrieves current AI configuration
 */
export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getAIConfig();

    return NextResponse.json({
      config,
      defaults: DEFAULT_AI_CONFIG,
      variables: SUPPORTED_VARIABLES,
      variableDescriptions: VARIABLE_DESCRIPTIONS,
      sampleVariables: SAMPLE_VARIABLES,
    });
  } catch (error: unknown) {
    console.error('Error fetching AI config:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch AI configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/prompts
 * Updates AI configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: AIConfig;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate required fields
    if (!body.provider || typeof body.provider !== 'string') {
      return NextResponse.json({ error: 'Provider is required (string)' }, { status: 400 });
    }

    if (!body.apiEndpoint || typeof body.apiEndpoint !== 'string') {
      return NextResponse.json({ error: 'API endpoint is required (URL string)' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(body.apiEndpoint);
    } catch {
      return NextResponse.json({ error: 'Invalid API endpoint URL format' }, { status: 400 });
    }

    if (!body.apiConfig || typeof body.apiConfig !== 'object') {
      return NextResponse.json(
        { error: 'API config is required and must be an object' },
        { status: 400 }
      );
    }

    await saveAIConfig(body);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error saving AI config:', error);
    const message = error instanceof Error ? error.message : 'Failed to save AI configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/prompts
 * Resets configuration to defaults
 */
export async function POST(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { action: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { action } = body;

    if (action === 'reset') {
      await resetAIConfig();
      return NextResponse.json({
        success: true,
        config: DEFAULT_AI_CONFIG,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error processing action:', error);
    const message = error instanceof Error ? error.message : 'Failed to process action';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
