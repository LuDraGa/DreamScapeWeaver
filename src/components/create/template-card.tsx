'use client'

import { ThemedCard } from '@/components/design-system/themed-card'
import type { Template, TemplateCompatibility } from '@/lib/types'

interface TemplateCardProps {
  template: Template
  compatibility: TemplateCompatibility
  onClick: () => void
}

export function TemplateCard({ template, compatibility, onClick }: TemplateCardProps) {
  // Compatibility badge styling
  const compatibilityConfig = {
    perfect: {
      icon: '✓',
      text: 'Perfect match',
      bgColor: 'rgba(34,197,94,0.1)',
      textColor: '#4ade80',
      borderColor: 'rgba(34,197,94,0.3)',
    },
    good: {
      icon: '→',
      text: 'Good fit',
      bgColor: 'rgba(99,102,241,0.1)',
      textColor: '#a5b4fc',
      borderColor: 'rgba(99,102,241,0.2)',
    },
    maybe: {
      icon: '⚠️',
      text: 'May need tweaking',
      bgColor: 'rgba(251,146,60,0.1)',
      textColor: '#fb923c',
      borderColor: 'rgba(251,146,60,0.3)',
    },
  }

  const compatConfig = compatibilityConfig[compatibility.level]

  return (
    <ThemedCard
      onClick={onClick}
      className="cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 group"
    >
      {/* Header with icon and duration */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template.icon}</span>
          <div>
            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
              {template.displayName}
            </h3>
            <p className="text-xs text-text-muted">{template.duration}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-3 line-clamp-2">{template.description}</p>

      {/* Compatibility Badge */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          background: compatConfig.bgColor,
          color: compatConfig.textColor,
          border: `1px solid ${compatConfig.borderColor}`,
        }}
      >
        <span>{compatConfig.icon}</span>
        <span>{compatConfig.text}</span>
      </div>

      {/* Warning message if applicable */}
      {compatibility.message && (
        <p className="text-xs text-text-muted mt-2 italic">{compatibility.message}</p>
      )}
    </ThemedCard>
  )
}
