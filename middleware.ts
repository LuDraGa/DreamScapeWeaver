import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Use ENABLE_AUTH (no NEXT_PUBLIC prefix) so middleware reads it at runtime, not build time
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true'

// Routes inside /app/* that require authentication
const PROTECTED_APP_PATHS = ['/app/studio', '/app/library', '/app/settings']

export async function middleware(request: NextRequest) {
  // Mock mode: no session enforcement locally
  if (!ENABLE_AUTH) {
    return NextResponse.next()
  }

  // Real mode: refresh session + protect specific /app/* routes
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtectedAppPath = PROTECTED_APP_PATHS.some((p) => path.startsWith(p))
  const isAuthRoute = path.startsWith('/auth')

  // Guests hitting protected app routes → land on create page (modal will prompt sign-in)
  if (isProtectedAppPath && !user) {
    return NextResponse.redirect(new URL('/app/create', request.url))
  }

  // Logged-in users visiting auth pages → go to app
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/app/create', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/app/:path*', '/auth/:path*'],
}
