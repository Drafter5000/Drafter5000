import { getServerSupabaseClient } from '@/lib/supabase-client';
import { appendCustomerToSheet, createCustomerSheet } from '@/lib/google-sheets';
import { serializeToRow, OnboardingRowData } from '@/lib/onboarding-serializer';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, display_name, preferred_language, delivery_days } =
      await request.json();

    if (!user_id || !email || !display_name || !delivery_days || delivery_days.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();

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
      const sheetName = 'Customers';

      // Prepare complete row data for serialization
      const rowData: OnboardingRowData = {
        email,
        display_name,
        created_at: new Date().toISOString(),
        preferred_language,
        delivery_days,
        status: 'active',
        style_samples: onboardingData?.style_samples || [],
        subjects: onboardingData?.subjects || [],
      };

      // Serialize to row format and append to Google Sheets
      const serializedRow = serializeToRow(rowData);

      // Use the existing appendCustomerToSheet for backward compatibility
      // but also log the full serialized row for debugging
      console.log('Serialized onboarding row:', serializedRow);

      await appendCustomerToSheet(spreadsheetId, sheetName, {
        email,
        display_name,
        created_at: rowData.created_at,
        preferred_language,
        delivery_days: delivery_days.join(','),
        status: 'active',
      });

      // Create individual sheet for customer's articles
      const customerSheetName = `${display_name.replace(/\s/g, '_')}_${Date.now()}`;
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
