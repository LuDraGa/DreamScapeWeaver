import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ThemedCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Card component with design system styling
 * Matches the prototype's visual style
 */
export function ThemedCard({ children, className, onClick }: ThemedCardProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl p-6 transition-all border',
        'bg-[rgba(15,23,42,0.6)] border-[#1e293b]',
        onClick && 'cursor-pointer hover:bg-[rgba(15,23,42,0.8)]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  )
}
