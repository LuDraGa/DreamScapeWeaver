'use client'

import { ThemedCard } from '@/components/design-system/themed-card'
import type { TemplateCategory } from '@/lib/types'

interface ContentTypeSelectorProps {
  onSelect: (category: TemplateCategory) => void
}

export function ContentTypeSelector({ onSelect }: ContentTypeSelectorProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1 text-text-primary">Where do you want to share this?</h2>
      <p className="text-sm mb-5 text-text-muted">Choose the type of content you want to create</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {/* Short-Form Video */}
        <ThemedCard
          onClick={() => onSelect('short-form')}
          className="cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="text-center py-6">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="font-semibold text-lg mb-2 text-text-primary">Short Videos</h3>
            <p className="text-sm text-text-muted mb-3">
              TikTok, Instagram Reels, YouTube Shorts
            </p>
            <p className="text-xs text-text-secondary">
              30s-3min viral content
            </p>
          </div>
        </ThemedCard>

        {/* Reddit Stories */}
        <ThemedCard
          onClick={() => onSelect('reddit')}
          className="cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🗨️</div>
            <h3 className="font-semibold text-lg mb-2 text-text-primary">Reddit Stories</h3>
            <p className="text-sm text-text-muted mb-3">
              Text-based storytelling
            </p>
            <p className="text-xs text-text-secondary">
              200-2000 word posts
            </p>
          </div>
        </ThemedCard>
      </div>
    </div>
  )
}
