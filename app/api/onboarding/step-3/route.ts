import { getServerSupabaseClient } from '@/lib/supabase-client';
import { appendToMainSheet, createCustomerSheet } from '@/lib/google-sheets';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, display_name, preferred_language, delivery_days } =
      await request.json();

    if (!user_id || !email || !display_name || !delivery_days || delivery_days.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();

    // Update user_profiles with display_name
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        display_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (profileError) throw profileError;

    // Save complete onboarding data
    const { error: updateError } = await supabase.from('onboarding_data').upsert(
      {
        user_id,
        email,
        display_name,
        preferred_language,
        delivery_days,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (updateError) throw updateError;

    // Fetch complete onboarding data including style_samples and subjects from previous steps
    const { data: onboardingData, error: fetchError } = await supabase
      .from('onboarding_data')
      .select('style_samples, subjects')
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      console.error('Error fetching onboarding data:', fetchError);
    }

    // Provision customer in Google Sheets
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMER_CONFIG_ID!;

      // Create individual sheet name for customer's articles
      const customerSheetName = `${display_name.replace(/\s/g, '_')}_${Date.now()}`;

      // Append customer config to Main Sheet
      await appendToMainSheet(spreadsheetId, {
        sheetName: customerSheetName,
        customerName: display_name,
        customerEmail: email,
        language: preferred_language,
        emailMonday: delivery_days.includes('monday'),
        emailTuesday: delivery_days.includes('tuesday'),
        emailWednesday: delivery_days.includes('wednesday'),
        emailThursday: delivery_days.includes('thursday'),
        emailFriday: delivery_days.includes('friday'),
        emailSaturday: delivery_days.includes('saturday'),
        emailSunday: delivery_days.includes('sunday'),
        paywallStatus: 'active',
        endOfMembership: '',
        customerSheetCreated: new Date().toISOString(),
        article1Example: '',
        article2Example: '',
        article3Example: '',
      });

      // Create individual sheet for customer's articles
      const headerRow = ['Subject', 'Status', 'Generated', 'Sent', 'Content', 'Notes'];

      const sheetId = await createCustomerSheet(
        process.env.GOOGLE_SHEETS_ARTICLES_ID!,
        customerSheetName,
        headerRow
      );

      // Save sheet references to Supabase
      await supabase
        .from('onboarding_data')
        .update({
          sheets_config_id: spreadsheetId,
          sheets_subjects_id: sheetId,
        })
        .eq('user_id', user_id);
    } catch (sheetsError) {
      console.error('Google Sheets provisioning error:', sheetsError);
      // Don't fail the request if sheets fail, but log it
    }

    return NextResponse.json({ success: true, redirectTo: '/dashboard' });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
