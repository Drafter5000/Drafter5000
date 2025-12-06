import { type NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-client';

// Default trial period in days - can be overridden by database config
const DEFAULT_TRIAL_DAYS = 0;
const DEFAULT_TRIAL_ENABLED = false;

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();

    let trialDays = DEFAULT_TRIAL_DAYS;
    let trialEnabled = DEFAULT_TRIAL_ENABLED;

    try {
      // Fetch both trial_enabled and trial_days from app_config
      const { data: configs } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['trial_enabled', 'paywall_trial_days']);

      if (configs) {
        for (const config of configs) {
          if (config.key === 'trial_enabled') {
            trialEnabled = config.value === 'true';
          } else if (config.key === 'paywall_trial_days') {
            const parsedDays = parseInt(config.value, 10);
            if (!isNaN(parsedDays) && parsedDays >= 0) {
              trialDays = parsedDays;
            }
          }
        }
      }
    } catch {
      // Table doesn't exist or no config found, use defaults
    }

    return NextResponse.json({
      trial_enabled: trialEnabled,
      trial_days: trialEnabled ? trialDays : 0,
      is_paywall_enabled: true,
    });
  } catch (error: unknown) {
    console.error('Config fetch error:', error);
    // Return defaults on error (no trial)
    return NextResponse.json({
      trial_enabled: DEFAULT_TRIAL_ENABLED,
      trial_days: DEFAULT_TRIAL_DAYS,
      is_paywall_enabled: true,
    });
  }
}
