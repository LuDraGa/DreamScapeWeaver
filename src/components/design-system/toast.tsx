'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  show: boolean
  onClose?: () => void
}

/**
 * Toast notification component
 * Slide-in animation from right
 */
export function Toast({ message, show, onClose }: ToastProps) {
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'px-4 py-3 rounded-xl',
        'bg-[rgba(15,23,42,0.95)] border border-[#1e293b]',
        'text-[#f1f5f9] text-sm font-medium',
        'shadow-lg animate-slide-in',
        'backdrop-blur-sm'
      )}
    >
      {message}
    </div>
  )
}
