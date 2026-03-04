/**
 * Environment variables and configuration
 */

export const env = {
  // OpenAI API
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Feature flags
  features: {
    useMockAdapter: process.env.NEXT_PUBLIC_USE_MOCK_ADAPTER === 'true',
    enableAuth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
  },
} as const

// Validation
export function validateEnv() {
  const errors: string[] = []

  if (!env.openai.apiKey && !env.features.useMockAdapter) {
    errors.push('OPENAI_API_KEY is required (or enable NEXT_PUBLIC_USE_MOCK_ADAPTER=true)')
  }

  if (env.features.enableAuth) {
    if (!env.supabase.url) errors.push('NEXT_PUBLIC_SUPABASE_URL is required when NEXT_PUBLIC_ENABLE_AUTH=true')
    if (!env.supabase.anonKey) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required when NEXT_PUBLIC_ENABLE_AUTH=true')
    if (!env.supabase.serviceRoleKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is required when NEXT_PUBLIC_ENABLE_AUTH=true')
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
}
