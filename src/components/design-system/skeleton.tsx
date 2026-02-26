import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Loading skeleton component
 * Pulsing animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[rgba(15,23,42,0.6)]',
        'animate-pulse-custom',
        className
      )}
    />
  )
}
