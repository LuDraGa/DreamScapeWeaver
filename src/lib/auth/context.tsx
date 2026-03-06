'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { AuthState, User } from '@/lib/types'
import type { UserRole } from '@/lib/auth/roles'
import { getMockUser, clearMockUser } from '@/lib/auth/mock'
import { useAppStore } from '@/store/app-store'

const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

interface AuthContextValue extends AuthState {
  logout: () => Promise<void>
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isGuest: true,
    isLoading: true,
    role: null,
  })

  const setUserAuthState = useAppStore((s) => s.setUserAuthState)

  function readMockAuth() {
    const mockUser = getMockUser()
    const isGuest = !mockUser
    setState({ user: mockUser, isGuest, isLoading: false, role: mockUser?.role ?? null })
    // Mock users have no real Supabase session — always use localStorage for persistence.
    // Auth state (isGuest above) handles UI; store's isGuest routes persistence.
    setUserAuthState(true)
  }

  useEffect(() => {
    if (!ENABLE_AUTH) {
      readMockAuth()
      return
    }

    // Real Supabase auth
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()

      const resolveUser = async (supabaseUser: { id: string; email?: string; created_at: string } | null) => {
        if (!supabaseUser) {
          setState({ user: null, isGuest: true, isLoading: false, role: null })
          setUserAuthState(true)
          return
        }

        // Upsert profile — creates row on first login, no-ops on subsequent logins.
        // Required so FK constraints on dreamscapes/output_variants are satisfied.
        await supabase
          .from('profiles')
          .upsert(
            { id: supabaseUser.id, email: supabaseUser.email ?? '' },
            { onConflict: 'id', ignoreDuplicates: true }
          )

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', supabaseUser.id)
          .single()

        const role: UserRole = profile?.role ?? 'normal'
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email ?? '',
          role,
          createdAt: supabaseUser.created_at,
        }
        setState({ user, isGuest: false, isLoading: false, role })
        setUserAuthState(false)
        // Hydrate settings from Supabase so create flow has up-to-date user preferences
        useAppStore.getState().loadSettings()
      }

      supabase.auth.getSession().then(({ data: { session } }) => {
        resolveUser(session?.user ?? null)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        resolveUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    })
  }, [])

  async function logout() {
    if (!ENABLE_AUTH) {
      clearMockUser()
      setState({ user: null, isGuest: true, isLoading: false, role: null })
      return
    }

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    // onAuthStateChange will update state automatically
  }

  function refreshAuth() {
    if (!ENABLE_AUTH) {
      readMockAuth()
    }
    // Real auth refreshes via onAuthStateChange — no manual call needed
  }

  return (
    <AuthContext.Provider value={{ ...state, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
