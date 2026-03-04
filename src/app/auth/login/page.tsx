'use client'

import { useRouter } from 'next/navigation'
import { setMockUser } from '@/lib/auth/mock'
import type { UserRole } from '@/lib/auth/roles'

const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

const MOCK_ROLES: { role: UserRole; label: string; description: string; accent: string }[] = [
  {
    role: 'normal',
    label: 'Normal User',
    description: 'Standard creator experience',
    accent: '#6366f1',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'User management + usage visibility',
    accent: '#f59e0b',
  },
  {
    role: 'dev',
    label: 'Dev',
    description: 'Prompt inspector + debug tools',
    accent: '#10b981',
  },
]

export default function LoginPage() {
  const router = useRouter()

  function handleMockLogin(role: UserRole) {
    setMockUser(role)
    router.push('/app/create')
    router.refresh()
  }

  // ── Mock mode (local dev) ─────────────────────────────────────────
  if (!ENABLE_AUTH) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#080c14' }}
      >
        <div className="w-full max-w-xs space-y-4">
          {/* Dev badge */}
          <div
            className="rounded-lg px-3 py-1.5 text-center text-xs font-medium"
            style={{
              background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            Dev Mode — Mock Login
          </div>

          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <p className="text-sm font-semibold text-center" style={{ color: '#f1f5f9' }}>
              Login as...
            </p>

            <div className="space-y-2">
              {MOCK_ROLES.map(({ role, label, description, accent }) => (
                <button
                  key={role}
                  onClick={() => handleMockLogin(role)}
                  className="w-full px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: `${accent}14`,
                    border: `1px solid ${accent}28`,
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: accent }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                    {description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Real auth (production) ────────────────────────────────────────
  // Rendered when NEXT_PUBLIC_ENABLE_AUTH=true
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#080c14' }}
    >
      <div className="w-full max-w-xs space-y-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <span className="text-white text-lg">✦</span>
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: '#f1f5f9' }}>
            StoryWeaver
          </span>
        </div>

        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <h1 className="text-base font-semibold text-center" style={{ color: '#f1f5f9' }}>
            Sign in
          </h1>

          {/* Google */}
          <GoogleButton />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(100,116,139,0.2)' }} />
            <span className="text-xs" style={{ color: '#64748b' }}>
              or
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(100,116,139,0.2)' }} />
          </div>

          {/* Email/password */}
          <EmailPasswordForm />
        </div>

        <p className="text-xs text-center" style={{ color: '#64748b' }}>
          No account?{' '}
          <a href="/auth/signup" style={{ color: '#a5b4fc' }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

// ── Sub-components (only rendered when real auth is on) ───────────

function GoogleButton() {
  async function handleGoogle() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <button
      onClick={handleGoogle}
      className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#f1f5f9',
      }}
    >
      <GoogleIcon />
      Continue with Google
    </button>
  )
}

function EmailPasswordForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert(error.message)
    } else {
      window.location.href = '/app/create'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(100,116,139,0.2)',
          color: '#f1f5f9',
        }}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(100,116,139,0.2)',
          color: '#f1f5f9',
        }}
      />
      <button
        type="submit"
        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
        style={{ background: '#6366f1', color: '#fff' }}
      >
        Sign in
      </button>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
