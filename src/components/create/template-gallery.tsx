'use client'

import { Button } from '@/components/ui/button'
import { TemplateCard } from './template-card'
import { checkTemplateCompatibility, sortTemplatesByCompatibility } from '@/lib/templates'
import type { Template, Dreamscape, TemplateCategory } from '@/lib/types'

interface TemplateGalleryProps {
  category: TemplateCategory
  templates: Template[]
  dreamscape: Dreamscape
  onSelectTemplate: (template: Template) => void
  onBack: () => void
}

export function TemplateGallery({
  category,
  templates,
  dreamscape,
  onSelectTemplate,
  onBack,
}: TemplateGalleryProps) {
  // Sort templates by compatibility with dreamscape
  const sortedTemplates = sortTemplatesByCompatibility(dreamscape, templates)

  const categoryTitle = category === 'short-form' ? 'Short Videos' : 'Reddit Stories'
  const categoryDescription =
    category === 'short-form'
      ? 'Choose a story type for TikTok, Reels, or YouTube Shorts'
      : 'Choose a subreddit style for your story'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{categoryTitle}</h2>
          <p className="text-sm text-text-muted">{categoryDescription}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="bg-transparent border-[#1e293b] text-text-secondary"
        >
          ← Back
        </Button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTemplates.map((template) => {
          const compatibility = checkTemplateCompatibility(dreamscape, template)
          return (
            <TemplateCard
              key={template.id}
              template={template}
              compatibility={compatibility}
              onClick={() => onSelectTemplate(template)}
            />
          )
        })}
      </div>
    </div>
  )
}
