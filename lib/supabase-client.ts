import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

let serverClient: ReturnType<typeof createServerClient> | null = null

export async function getServerSupabaseClient() {
  if (serverClient) return serverClient

  const cookieStore = await cookies()

  serverClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Silently fail
        }
      },
    },
  })

  return serverClient
}

export async function getServerSupabaseSession() {
  const supabase = await getServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
