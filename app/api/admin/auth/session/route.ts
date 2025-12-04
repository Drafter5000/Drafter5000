import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated or not an admin' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Admin session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
