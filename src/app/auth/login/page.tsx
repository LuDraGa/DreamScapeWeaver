'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Login is now handled via the modal in the app layout.
 * This page exists only as a fallback for edge cases (e.g. middleware redirect).
 * It immediately sends the user to /app/create where the Sign in button is visible.
 */
export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/app/create')
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#080c14' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        <span className="text-white text-lg">✦</span>
      </div>
    </div>
  )
}
