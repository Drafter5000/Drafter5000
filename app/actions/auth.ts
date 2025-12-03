'use server'

import { getServerSupabaseClient } from '@/lib/supabase-client'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getStripeClient } from '@/lib/stripe-client'
import type { UserProfile } from '@/lib/types'

export async function signUpAction(email: string, password: string, displayName: string) {
  try {
    const supabase = await getServerSupabaseClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // Create Stripe customer
    const stripe = getStripeClient()
    const customer = await stripe.customers.create({
      email,
      metadata: {
        supabase_uid: authData.user.id,
      },
    })

    // Create user profile in database using admin client to bypass RLS
    // This is necessary because auth.uid() is not available immediately after signup
    const supabaseAdmin = getSupabaseAdmin()
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: authData.user.id,
      email,
      display_name: displayName,
      stripe_customer_id: customer.id,
      subscription_status: 'trial',
      subscription_plan: 'free',
    })

    if (profileError) throw profileError

    return {
      success: true,
      user: authData.user,
      message: 'Signup successful. Please check your email to confirm.',
    }
  } catch (error) {
    console.error('[Auth] Signup error:', error)
    throw error
  }
}

export async function signInAction(email: string, password: string) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error('[Auth] Signin error:', error)
    throw error
  }
}

export async function signOutAction() {
  try {
    const supabase = await getServerSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[Auth] Signout error:', error)
    throw error
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await getServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return null

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) return null

    return profile as UserProfile
  } catch (error) {
    console.error('[Auth] Get user profile error:', error)
    return null
  }
}
