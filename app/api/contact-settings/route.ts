import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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
  email: string | null;
  emailEnabled: boolean;
  emailCategory: string;
  location: string | null;
  locationEnabled: boolean;
  locationCategory: string;
  businessHours: BusinessHours[];
  businessHoursEnabled: boolean;
  businessHoursCategory: string;
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

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: configs } = await supabase
      .from('app_config')
      .select('key, value')
      .like('key', 'contact_%');

    const settings: ContactSettings = {
      email: 'support@example.com',
      emailEnabled: true,
      emailCategory: 'general',
      location: '123 Business Street\nSan Francisco, CA 94102',
      locationEnabled: true,
      locationCategory: 'headquarters',
      businessHours: defaultBusinessHours,
      businessHoursEnabled: true,
      businessHoursCategory: 'standard',
      categories: defaultCategories,
    };

    if (configs) {
      for (const config of configs) {
        switch (config.key) {
          case 'contact_email':
            settings.email = config.value || null;
            break;
          case 'contact_email_enabled':
            settings.emailEnabled = config.value !== 'false';
            break;
          case 'contact_email_category':
            settings.emailCategory = config.value || 'general';
            break;
          case 'contact_location':
            settings.location = config.value || null;
            break;
          case 'contact_location_enabled':
            settings.locationEnabled = config.value !== 'false';
            break;
          case 'contact_location_category':
            settings.locationCategory = config.value || 'headquarters';
            break;
          case 'contact_business_hours':
            try {
              settings.businessHours = JSON.parse(config.value) || defaultBusinessHours;
            } catch {
              settings.businessHours = defaultBusinessHours;
            }
            break;
          case 'contact_business_hours_enabled':
            settings.businessHoursEnabled = config.value !== 'false';
            break;
          case 'contact_business_hours_category':
            settings.businessHoursCategory = config.value || 'standard';
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

    // Only return enabled settings for public consumption
    return NextResponse.json({
      email: settings.emailEnabled ? settings.email : null,
      emailCategory: settings.emailEnabled ? settings.emailCategory : null,
      location: settings.locationEnabled ? settings.location : null,
      locationCategory: settings.locationEnabled ? settings.locationCategory : null,
      businessHours: settings.businessHoursEnabled ? settings.businessHours : null,
      businessHoursCategory: settings.businessHoursEnabled ? settings.businessHoursCategory : null,
      categories: settings.categories.email,
    });
  } catch (error) {
    console.error('Error fetching contact settings:', error);
    return NextResponse.json({ error: 'Failed to fetch contact settings' }, { status: 500 });
  }
}
