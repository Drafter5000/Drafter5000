import { NextResponse } from 'next/server';
import { getLandingStats } from '@/lib/services/landing-stats';

/**
 * GET /api/landing-stats
 * Returns dynamic statistics for the landing page
 * - articlesSent: Count of articles with 'sent' status
 * - activeCustomers: Count of users with active/trialing subscriptions
 *
 * Includes caching headers for optimal performance
 */
export async function GET() {
  try {
    const stats = await getLandingStats();

    // Add cache headers for better performance
    // Cache for 5 minutes on CDN, allow stale for 1 hour while revalidating
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Error in landing-stats API:', error);

    // Return fallback values on error (no cache for errors)
    return NextResponse.json(
      {
        articlesSent: 0,
        activeCustomers: 0,
        formattedArticles: '0+',
        formattedCustomers: '0+',
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
