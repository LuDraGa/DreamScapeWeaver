import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Supabase client using service_role key.
 * Bypasses RLS — use ONLY for server-side billing operations
 * (credit debit, ledger writes, webhook handlers, cron jobs).
 *
 * NEVER expose this client to the browser or import from client components.
 */
export function createServiceClient() {
  return createSupabaseClient(
    env.supabase.url,
    env.supabase.serviceRoleKey,
    {
      db: { schema: 'storyweaver' },
      auth: { persistSession: false },
    }
  )
}
