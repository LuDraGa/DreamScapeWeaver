import { localStorageAdapter } from './local'
import { supabaseAdapter } from './supabase'

const REAL_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

/**
 * Persistence router
 * Automatically selects the correct adapter based on auth state
 * When real auth is disabled (mock login), always use localStorage
 */
export function getPersistenceAdapter(isGuest: boolean) {
  if (isGuest || !REAL_AUTH_ENABLED) return localStorageAdapter
  return supabaseAdapter
}

// Re-export adapters for direct access if needed
export { localStorageAdapter, supabaseAdapter }
