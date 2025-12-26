import { type NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import {
  getProviders,
  saveApiKey,
  deleteApiKey,
  validateApiKeyFormat,
} from '@/lib/services/llm-providers';

/**
 * GET /api/admin/llm-providers
 * Returns all LLM providers with their configuration status
 */
export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await getProviders();
    return NextResponse.json({ providers });
  } catch (error: unknown) {
    console.error('Error fetching LLM providers:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch providers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/llm-providers
 * Save or delete an API key for a provider
 */
export async function POST(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { action: 'save' | 'delete'; providerId: string; apiKey?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { action, providerId, apiKey } = body;

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    if (action === 'save') {
      if (!apiKey) {
        return NextResponse.json({ error: 'API key is required' }, { status: 400 });
      }

      // Validate API key format
      const validation = validateApiKeyFormat(providerId, apiKey);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      await saveApiKey(providerId, apiKey);
      return NextResponse.json({ success: true, message: 'API key saved successfully' });
    }

    if (action === 'delete') {
      await deleteApiKey(providerId);
      return NextResponse.json({ success: true, message: 'API key deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error managing LLM provider:', error);
    const message = error instanceof Error ? error.message : 'Failed to manage provider';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
