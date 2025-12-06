import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from '@/lib/admin-auth';

interface AppSettings {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxUsersPerOrg: number;
  trialEnabled: boolean;
  trialDays: number;
}

const defaultSettings: AppSettings = {
  siteName: 'Drafter',
  supportEmail: '',
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: true,
  maxUsersPerOrg: 50,
  trialEnabled: false,
  trialDays: 7,
};

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch all settings from app_config table
    const { data: configs } = await supabase.from('app_config').select('key, value');

    const settings: AppSettings = { ...defaultSettings };

    if (configs) {
      for (const config of configs) {
        switch (config.key) {
          case 'site_name':
            settings.siteName = config.value || defaultSettings.siteName;
            break;
          case 'support_email':
            settings.supportEmail = config.value || defaultSettings.supportEmail;
            break;
          case 'maintenance_mode':
            settings.maintenanceMode = config.value === 'true';
            break;
          case 'allow_registration':
            settings.allowRegistration = config.value !== 'false';
            break;
          case 'require_email_verification':
            settings.requireEmailVerification = config.value !== 'false';
            break;
          case 'max_users_per_org':
            settings.maxUsersPerOrg = parseInt(config.value, 10) || defaultSettings.maxUsersPerOrg;
            break;
          case 'trial_enabled':
            settings.trialEnabled = config.value === 'true';
            break;
          case 'paywall_trial_days':
            settings.trialDays = parseInt(config.value, 10) || defaultSettings.trialDays;
            break;
        }
      }
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // Map settings to config keys
    const configUpdates = [
      { key: 'site_name', value: body.siteName || '' },
      { key: 'support_email', value: body.supportEmail || '' },
      { key: 'maintenance_mode', value: String(body.maintenanceMode || false) },
      { key: 'allow_registration', value: String(body.allowRegistration !== false) },
      { key: 'require_email_verification', value: String(body.requireEmailVerification !== false) },
      { key: 'max_users_per_org', value: String(body.maxUsersPerOrg || 50) },
      { key: 'trial_enabled', value: String(body.trialEnabled || false) },
      { key: 'paywall_trial_days', value: String(body.trialDays || 7) },
    ];

    // Upsert each config
    for (const config of configUpdates) {
      await supabase.from('app_config').upsert(
        {
          key: config.key,
          value: config.value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
