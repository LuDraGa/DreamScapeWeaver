import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { grantSignupBonus } from '@/lib/billing/credits'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app/create'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile row exists (no-op if already created)
      await supabase.from('profiles').upsert(
        { id: data.user.id, email: data.user.email ?? '', role: 'normal' },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      // Grant signup bonus credits (idempotent — only grants once)
      await grantSignupBonus(data.user.id).catch((err) =>
        console.error('Signup bonus grant failed:', err)
      )

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
