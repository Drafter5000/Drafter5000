import { type NextRequest, NextResponse } from 'next/server';
import {
  getArticleStyle,
  updateArticleStyle,
  deleteArticleStyle,
} from '@/lib/services/article-styles';
import { updateStyleInSheets, deleteStyleFromSheets } from '@/lib/services/article-styles-sync';

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

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Verify style exists and belongs to user
    const existing = await getArticleStyle(id, user_id);
    if (!existing) {
      return NextResponse.json({ error: 'Style not found' }, { status: 404 });
    }

    const style = await updateArticleStyle(id, user_id, updateData);

    // Sync to Google Sheets (non-blocking)
    updateStyleInSheets(style).catch(err => {
      console.error('Failed to sync update to sheets:', err);
    });

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
