import { type NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-client';

// Default trial period in days - can be overridden by database config
const DEFAULT_TRIAL_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();

    // Try to fetch trial days from app_config table if it exists
    // This allows dynamic configuration from a spreadsheet or admin panel
    let trialDays = DEFAULT_TRIAL_DAYS;

    try {
      const { data: config } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'paywall_trial_days')
        .single();

      if (config?.value) {
        const parsedDays = parseInt(config.value, 10);
        if (!isNaN(parsedDays) && parsedDays >= 0) {
          trialDays = parsedDays;
        }
      }
    } catch {
      // Table doesn't exist or no config found, use default
    }

    return NextResponse.json({
      trial_days: trialDays,
      is_paywall_enabled: true,
    });
  } catch (error: unknown) {
    console.error('Config fetch error:', error);
    // Return defaults on error
    return NextResponse.json({
      trial_days: DEFAULT_TRIAL_DAYS,
      is_paywall_enabled: true,
    });
  }
}
