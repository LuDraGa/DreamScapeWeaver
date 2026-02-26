import { localStorageAdapter } from './local'
import { supabaseAdapter } from './supabase'

/**
 * Persistence router
 * Automatically selects the correct adapter based on auth state
 *
 * Phase 1: Always uses localStorage (guest mode)
 * Phase 2: Uses Supabase for authenticated users
 */
export function getPersistenceAdapter(isGuest: boolean) {
  return isGuest ? localStorageAdapter : supabaseAdapter
}

// Re-export adapters for direct access if needed
export { localStorageAdapter, supabaseAdapter }
