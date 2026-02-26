'use client'

import { useEffect } from 'react'
import { migrateStorageKeys } from '@/lib/persistence/local'

/**
 * Client-side migration component
 * Runs storage key migration once on mount
 */
export function ClientMigration() {
  useEffect(() => {
    migrateStorageKeys()
  }, [])

  return null
}
