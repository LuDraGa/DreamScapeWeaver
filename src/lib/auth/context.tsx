'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { AuthState } from '@/lib/types'

const AuthContext = createContext<AuthState | null>(null)

/**
 * Auth Provider (stub for Phase 1)
 * Always returns guest user
 * Phase 2: Integrate with Supabase Auth
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Phase 1: Always guest
  const authState: AuthState = {
    user: null,
    isGuest: true,
    isLoading: false,
  }

  // Phase 2: Use Supabase Auth
  // const [user, setUser] = useState<User | null>(null)
  // const [isLoading, setIsLoading] = useState(true)
  //
  // useEffect(() => {
  //   const { data } = supabase.auth.onAuthStateChange((event, session) => {
  //     setUser(session?.user ?? null)
  //     setIsLoading(false)
  //   })
  //   return () => data.subscription.unsubscribe()
  // }, [])

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
