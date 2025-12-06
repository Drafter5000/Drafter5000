import { appendToMainSheet } from '@/lib/google-sheets';
import { getServerSupabaseClient } from '@/lib/supabase-client';
import type { ArticleStyle } from '@/lib/types';
import Stripe from 'stripe';

export interface SyncResult {
  success: boolean;
  sheetsConfigId?: string;
  sheetsRowId?: string;
  error?: string;
}

/**
 * Language code to full name mapping
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
};

/**
 * Get the full language name from a language code
 */
function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the subscription end date for a user
 */
async function getSubscriptionEndDate(userId: string): Promise<string> {
  try {
    const supabase = await getServerSupabaseClient();

    // Get user's Stripe customer ID and subscription status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, subscription_status, subscription_plan')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      // No Stripe customer, return empty
      return '';
    }

    // If user is on free plan, no end date
    if (profile.subscription_plan === 'free') {
      return '';
    }

    // Get subscription details from Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.warn('STRIPE_SECRET_KEY not configured');
      return '';
    }

    const stripe = new Stripe(stripeSecretKey);

    // List active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return '';
    }

    const subscription = subscriptions.data[0];

    // Get the current period end date
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end * 1000);
      return formatDate(endDate);
    }

    return '';
  } catch (error) {
    console.error('Failed to get subscription end date:', error);
    return '';
  }
}

export async function syncStyleToSheets(style: ArticleStyle): Promise<SyncResult> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ARTICLES_ID;
    if (!spreadsheetId) {
      console.warn('GOOGLE_SHEETS_ARTICLES_ID not configured, skipping sync');
      return { success: true };
    }

    const endOfMembership = await getSubscriptionEndDate(style.user_id);
    const customerSheetName = `${style.display_name || style.name || style.user_id}`;

    await appendToMainSheet(spreadsheetId, {
      sheetName: customerSheetName,
      customerName: style.display_name || style.name || style.user_id,
      customerEmail: style.email || '',
      language: getLanguageName(style.preferred_language),
      emailMonday: style.delivery_days.includes('mon'),
      emailTuesday: style.delivery_days.includes('tue'),
      emailWednesday: style.delivery_days.includes('wed'),
      emailThursday: style.delivery_days.includes('thu'),
      emailFriday: style.delivery_days.includes('fri'),
      emailSaturday: style.delivery_days.includes('sat'),
      emailSunday: style.delivery_days.includes('sun'),
      paywallStatus: 'paid',
      endOfMembership,
      customerSheetCreated: 'Yes',
      article1Example: style.style_samples[0] || '',
      article2Example: style.style_samples[1] || '',
      article3Example: style.style_samples[2] || '',
    });

    return {
      success: true,
      sheetsConfigId: spreadsheetId,
    };
  } catch (error) {
    console.error('Failed to sync style to Google Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteStyleFromSheets(styleId: string): Promise<SyncResult> {
  try {
    // Note: Google Sheets API doesn't easily support row deletion by ID
    // For now, we log the deletion and handle it manually or via a cleanup job
    console.log(
      `Style ${styleId} deleted from PostgreSQL. Manual cleanup may be needed in Sheets.`
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to delete style from Google Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateStyleInSheets(style: ArticleStyle): Promise<SyncResult> {
  try {
    // For updates, we would need to find and update the specific row
    // This is complex with Google Sheets API, so we log for now
    console.log(`Style ${style.id} updated. Sheets sync for updates not yet implemented.`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update style in Google Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
