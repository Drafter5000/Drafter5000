import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const publicRoutes = ["/", "/login", "/pricing", "/auth/callback"]

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return supabaseResponse
  }

  // Protect authenticated routes
  if (!user && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect authenticated users away from login
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
