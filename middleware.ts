import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

export async function middleware(request: NextRequest) {
  // Mock mode: no session enforcement locally
  if (!ENABLE_AUTH) {
    return NextResponse.next()
  }

  // Real mode: refresh session + protect /app/* routes
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

  const isAppRoute = request.nextUrl.pathname.startsWith('/app')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/app/create', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/app/:path*', '/auth/:path*'],
}
