import { getServerSupabaseClient } from "@/lib/supabase-client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const supabase = await getServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (!data.session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 400 })
    }

    return NextResponse.json({ success: true, session: data.session })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error.message || "Failed to sign in" }, { status: 500 })
  }
}
