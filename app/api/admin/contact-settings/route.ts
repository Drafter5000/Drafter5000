import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from '@/lib/admin-auth';

interface BusinessHours {
  id: string;
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface CategoryOptions {
  email: string[];
}

interface ContactSettings {
  email: string;
  emailEnabled: boolean;
  location: string;
  locationEnabled: boolean;
  businessHours: BusinessHours[];
  businessHoursEnabled: boolean;
  categories: CategoryOptions;
}

const defaultBusinessHours: BusinessHours[] = [
  { id: '1', day: 'Monday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '2', day: 'Tuesday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '3', day: 'Wednesday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '4', day: 'Thursday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '5', day: 'Friday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '6', day: 'Saturday', openTime: '10:00', closeTime: '14:00', isClosed: true },
  { id: '7', day: 'Sunday', openTime: '10:00', closeTime: '14:00', isClosed: true },
];

const defaultCategories: CategoryOptions = {
  email: ['general', 'support', 'sales', 'billing', 'partnerships'],
};

const defaultSettings: ContactSettings = {
  email: 'support@example.com',
  emailEnabled: true,
  location: '123 Business Street\nSan Francisco, CA 94102',
  locationEnabled: true,
  businessHours: defaultBusinessHours,
  businessHoursEnabled: true,
  categories: defaultCategories,
};

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: configs } = await supabase
      .from('app_config')
      .select('key, value')
      .like('key', 'contact_%');

    const settings: ContactSettings = { ...defaultSettings };

    if (configs) {
      for (const config of configs) {
        switch (config.key) {
          case 'contact_email':
            settings.email = config.value || defaultSettings.email;
            break;
          case 'contact_email_enabled':
            settings.emailEnabled = config.value !== 'false';
            break;
          case 'contact_location':
            settings.location = config.value || defaultSettings.location;
            break;
          case 'contact_location_enabled':
            settings.locationEnabled = config.value !== 'false';
            break;
          case 'contact_business_hours':
            try {
              settings.businessHours = JSON.parse(config.value) || defaultSettings.businessHours;
            } catch {
              settings.businessHours = defaultSettings.businessHours;
            }
            break;
          case 'contact_business_hours_enabled':
            settings.businessHoursEnabled = config.value !== 'false';
            break;
          case 'contact_categories':
            try {
              settings.categories = JSON.parse(config.value) || defaultCategories;
            } catch {
              settings.categories = defaultCategories;
            }
            break;
        }
      }
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching contact settings:', error);
    return NextResponse.json({ error: 'Failed to fetch contact settings' }, { status: 500 });
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

    const configUpdates = [
      { key: 'contact_email', value: body.email || '' },
      { key: 'contact_email_enabled', value: String(body.emailEnabled !== false) },
      { key: 'contact_location', value: body.location || '' },
      { key: 'contact_location_enabled', value: String(body.locationEnabled !== false) },
      {
        key: 'contact_business_hours',
        value: JSON.stringify(body.businessHours || defaultBusinessHours),
      },
      { key: 'contact_business_hours_enabled', value: String(body.businessHoursEnabled !== false) },
      { key: 'contact_categories', value: JSON.stringify(body.categories || defaultCategories) },
    ];

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
    console.error('Error saving contact settings:', error);
    return NextResponse.json({ error: 'Failed to save contact settings' }, { status: 500 });
  }
}
