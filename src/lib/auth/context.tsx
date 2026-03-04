'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { AuthState, User } from '@/lib/types'
import type { UserRole } from '@/lib/auth/roles'
import { getMockUser } from '@/lib/auth/mock'

const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isGuest: true,
    isLoading: true,
    role: null,
  })

  useEffect(() => {
    if (!ENABLE_AUTH) {
      // Mock mode — read from localStorage
      const mockUser = getMockUser()
      setState({
        user: mockUser,
        isGuest: !mockUser,
        isLoading: false,
        role: mockUser?.role ?? null,
      })
      return
    }

    // Real Supabase auth
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()

      const resolveUser = async (supabaseUser: { id: string; email?: string; created_at: string } | null) => {
        if (!supabaseUser) {
          setState({ user: null, isGuest: true, isLoading: false, role: null })
          return
        }

        // Fetch role from profiles table
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
      }

      // Initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        resolveUser(session?.user ?? null)
      })

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        resolveUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    })
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
