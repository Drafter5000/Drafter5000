import { getServerSupabaseClient } from '@/lib/supabase-client';
import { type NextRequest, NextResponse } from 'next/server';

// Default site configuration
const DEFAULT_SITE_NAME = 'Drafter5000';
const DEFAULT_LOGO_URL = '/logo/logo_new.png';

export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();

    let siteName = DEFAULT_SITE_NAME;
    let logoUrl = DEFAULT_LOGO_URL;
    let updatedAt = new Date().toISOString();

    try {
      // Fetch site config from app_config
      const { data: configs } = await supabase
        .from('app_config')
        .select('key, value, updated_at')
        .in('key', ['site_name', 'logo_url']);

      if (configs) {
        for (const config of configs) {
          if (config.key === 'site_name' && config.value) {
            siteName = config.value;
            if (config.updated_at) {
              updatedAt = config.updated_at;
            }
          } else if (config.key === 'logo_url' && config.value) {
            logoUrl = config.value;
            if (config.updated_at && config.updated_at > updatedAt) {
              updatedAt = config.updated_at;
            }
          }
        }
      }
    } catch {
      // Table doesn't exist or no config found, use defaults
    }

    const response: SiteConfig = {
      siteName,
      logoUrl,
      updatedAt,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: unknown) {
    console.error('Site config fetch error:', error);
    // Return defaults on error
    return NextResponse.json({
      siteName: DEFAULT_SITE_NAME,
      logoUrl: DEFAULT_LOGO_URL,
      updatedAt: new Date().toISOString(),
    });
  }
}
