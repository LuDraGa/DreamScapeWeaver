import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique ID
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Parse multi-part output text
 */
export interface OutputPart {
  partNumber: number
  content: string
  nextPartBrief?: string
}

export interface ParsedOutput {
  parts: OutputPart[]
  isMultiPart: boolean
}

export function parseMultiPartOutput(text: string): ParsedOutput {
  // Check if output contains multi-part markers
  const continuationRegex = /\[TO BE CONTINUED IN PART (\d+)\]\s*(?:PART \d+ SHOULD START WITH:\s*(.+?))?(?=\n\n|\n\[|$)/gis
  const matches = Array.from(text.matchAll(continuationRegex))

  if (matches.length === 0) {
    // Single-part output
    return {
      parts: [{ partNumber: 1, content: text }],
      isMultiPart: false,
    }
  }

  // Multi-part output - split by continuation markers
  const parts: OutputPart[] = []
  let lastIndex = 0

  matches.forEach((match, i) => {
    const nextPartNumber = parseInt(match[1])
    const nextPartBrief = match[2]?.trim()
    const endIndex = match.index!

    // Get content up to this marker
    const content = text.slice(lastIndex, endIndex).trim()
    parts.push({
      partNumber: i + 1,
      content,
      nextPartBrief,
    })

    lastIndex = match.index! + match[0].length
  })

  // Add any remaining content as last part (if exists)
  if (lastIndex < text.length) {
    const remainingContent = text.slice(lastIndex).trim()
    if (remainingContent) {
      parts.push({
        partNumber: parts.length + 1,
        content: remainingContent,
      })
    }
  }

  return {
    parts,
    isMultiPart: true,
  }
}
