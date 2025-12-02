"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getBrowserSupabaseClient } from "@/lib/supabase-browser"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = getBrowserSupabaseClient()

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const supabase = getBrowserSupabaseClient()
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      setError(err as Error)
    }
  }, [router])

  return { user, loading, error, signOut, isAuthenticated: !!user }
}
