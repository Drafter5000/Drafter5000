"use server"

import { getServerSupabaseClient } from "@/lib/supabase-client"
import { appendCustomerToSheet, createCustomerSheet } from "@/lib/google-sheets"
import type { OnboardingData } from "@/lib/types"

export async function saveOnboardingStep1(userId: string, styleSamples: string[]) {
  try {
    const supabase = await getServerSupabaseClient()

    const { error } = await supabase.from("onboarding_data").upsert({
      user_id: userId,
      style_samples: styleSamples,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[Onboarding] Step 1 error:", error)
    throw error
  }
}

export async function saveOnboardingStep2(userId: string, subjects: string[]) {
  try {
    const supabase = await getServerSupabaseClient()

    const { error } = await supabase.from("onboarding_data").upsert({
      user_id: userId,
      subjects,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[Onboarding] Step 2 error:", error)
    throw error
  }
}

export async function completeOnboarding(userId: string, onboardingData: Partial<OnboardingData>) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: existingData, error: fetchError } = await supabase
      .from("onboarding_data")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") throw fetchError

    const mergedData = {
      ...existingData,
      ...onboardingData,
      completed_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase.from("onboarding_data").upsert({
      user_id: userId,
      ...mergedData,
    })

    if (upsertError) throw upsertError

    if (process.env.GOOGLE_SHEETS_CONFIG_SPREADSHEET_ID) {
      try {
        await appendCustomerToSheet(process.env.GOOGLE_SHEETS_CONFIG_SPREADSHEET_ID, "Customers", {
          email: onboardingData.email || "",
          display_name: onboardingData.display_name || "",
          created_at: new Date().toISOString(),
          preferred_language: onboardingData.preferred_language || "English",
          delivery_days: (onboardingData.delivery_days || []).join(","),
          status: "active",
        })

        // Create subject sheet for customer
        const sheetName = `${userId}-subjects`
        const newSheetId = await createCustomerSheet(process.env.GOOGLE_SHEETS_CONFIG_SPREADSHEET_ID, sheetName, [
          "Subject",
          "Status",
          "Generated At",
          "Sent At",
          "Content Preview",
        ])

        // Update onboarding record with sheet IDs
        await supabase.from("onboarding_data").update({
          sheets_config_id: process.env.GOOGLE_SHEETS_CONFIG_SPREADSHEET_ID,
          sheets_subjects_id: newSheetId,
        })
      } catch (sheetsError) {
        console.warn("[Onboarding] Google Sheets integration warning:", sheetsError)
        // Don't fail the entire flow if sheets integration fails
      }
    }

    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        subscription_status: "active",
      })
      .eq("id", userId)

    if (profileError) throw profileError

    return { success: true }
  } catch (error) {
    console.error("[Onboarding] Completion error:", error)
    throw error
  }
}
