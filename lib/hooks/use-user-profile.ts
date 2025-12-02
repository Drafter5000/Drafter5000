"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "./use-auth"
import type { UserProfile } from "@/lib/types"
import { apiClient } from "@/lib/api-client"

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      const data = await apiClient.get<UserProfile>(`/dashboard/profile/${userId}`)
      setProfile(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchProfile(user.id)
    }
  }, [user?.id, authLoading, fetchProfile])

  return { profile, loading: loading || authLoading, error, refetch: () => user?.id && fetchProfile(user.id) }
}
