import { type NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import {
  getPromptConfig,
  savePromptConfig,
  resetPromptConfig,
  validatePromptConfig,
  generatePreview,
  DEFAULT_PROMPT_CONFIG,
  SUPPORTED_VARIABLES,
  VARIABLE_DESCRIPTIONS,
  SAMPLE_VARIABLES,
  type PromptConfigFull,
} from '@/lib/services/prompt-config';

/**
 * GET /api/admin/prompts
 * Retrieves current prompt configuration
 */
export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getPromptConfig();

    return NextResponse.json({
      config,
      defaults: DEFAULT_PROMPT_CONFIG,
      variables: SUPPORTED_VARIABLES,
      variableDescriptions: VARIABLE_DESCRIPTIONS,
      sampleVariables: SAMPLE_VARIABLES,
    });
  } catch (error: unknown) {
    console.error('Error fetching prompt config:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch prompt configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/prompts
 * Updates prompt configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: PromptConfigFull;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate the prompt configuration
    const validation = validatePromptConfig(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await savePromptConfig(body);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error saving prompt config:', error);
    const message = error instanceof Error ? error.message : 'Failed to save prompt configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/prompts
 * Resets prompts to default values or generates preview
 */
export async function POST(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { action: string; config?: PromptConfigFull };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { action, config } = body;

    if (action === 'reset') {
      await resetPromptConfig();
      return NextResponse.json({
        success: true,
        config: DEFAULT_PROMPT_CONFIG,
      });
    }

    if (action === 'preview') {
      if (!config) {
        return NextResponse.json({ error: 'Config is required for preview' }, { status: 400 });
      }
      const preview = generatePreview(config);
      return NextResponse.json({ preview });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error processing prompt action:', error);
    const message = error instanceof Error ? error.message : 'Failed to process action';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
