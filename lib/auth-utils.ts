import { getBrowserSupabaseClient } from "./supabase-browser"

export async function signUp(email: string, password: string) {
  const supabase = getBrowserSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const supabase = getBrowserSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = getBrowserSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = getBrowserSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
