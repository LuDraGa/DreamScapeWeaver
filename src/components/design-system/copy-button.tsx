'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn, copyToClipboard } from '@/lib/utils'
import { CopyIcon, CheckIcon } from '@/components/icons'

interface CopyButtonProps {
  text: string
  className?: string
}

/**
 * Copy button with success feedback
 * Matches prototype style
 */
export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 rounded-lg transition-all',
        'bg-transparent hover:bg-[rgba(15,23,42,0.5)]',
        'text-[#64748b] hover:text-[#f1f5f9]',
        className
      )}
      onClick={handleCopy}
    >
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
    </Button>
  )
}
