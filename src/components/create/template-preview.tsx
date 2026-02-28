'use client'

import { Button } from '@/components/ui/button'
import { ThemedCard } from '@/components/design-system/themed-card'
import type { Template } from '@/lib/types'

interface TemplatePreviewProps {
  template: Template
  onGenerate: () => void
  onBack: () => void
  generating: boolean
}

export function TemplatePreview({ template, onGenerate, onBack, generating }: TemplatePreviewProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{template.icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{template.displayName}</h2>
            <p className="text-sm text-text-muted">{template.description}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={generating}
          className="bg-transparent border-[#1e293b] text-text-secondary"
        >
          ← Back
        </Button>
      </div>

      {/* Template Details */}
      <ThemedCard className="mb-6">
        <h3 className="font-medium text-text-primary mb-3">Template Settings</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Platform{template.platforms.length > 1 ? 's' : ''}:</span>
            <p className="text-text-primary font-medium capitalize">
              {template.platforms.join(', ').replace(/-/g, ' ')}
            </p>
          </div>

          <div>
            <span className="text-text-muted">Duration:</span>
            <p className="text-text-primary font-medium">{template.duration}</p>
          </div>

          <div>
            <span className="text-text-muted">Word Count:</span>
            <p className="text-text-primary font-medium">~{template.wordCount} words</p>
          </div>

          <div>
            <span className="text-text-muted">Tone:</span>
            <p className="text-text-primary font-medium capitalize">{template.settings.tone}</p>
          </div>

          {template.settings.genres.length > 0 && (
            <div className="col-span-2">
              <span className="text-text-muted">Genres:</span>
              <p className="text-text-primary font-medium capitalize">
                {template.settings.genres.join(', ')}
              </p>
            </div>
          )}

          {template.subreddit && (
            <div className="col-span-2">
              <span className="text-text-muted">Subreddit:</span>
              <p className="text-text-primary font-medium">r/{template.subreddit}</p>
            </div>
          )}
        </div>
      </ThemedCard>

      {/* What This Creates */}
      <ThemedCard className="mb-6 bg-primary/5 border-primary/20">
        <h3 className="font-medium text-text-primary mb-2">What this template creates:</h3>
        <ul className="text-sm text-text-secondary space-y-1.5 list-disc list-inside">
          {template.category === 'short-form' && (
            <>
              <li>Optimized for {template.platforms.join('/')}</li>
              <li>Hook viewers in the first 3 seconds</li>
              <li>Maximize watch-through and engagement</li>
              <li>Format ready for video narration</li>
            </>
          )}
          {template.category === 'reddit' && (
            <>
              <li>Written for r/{template.subreddit} community</li>
              <li>Follows subreddit conventions and rules</li>
              <li>Optimized for upvotes and comments</li>
              <li>Authentic, relatable storytelling</li>
            </>
          )}
        </ul>
      </ThemedCard>

      {/* Example Output (Optional) */}
      {template.exampleOutput && !template.exampleOutput.includes('[Note:') && (
        <ThemedCard className="mb-6">
          <h3 className="font-medium text-text-primary mb-2">Example Output:</h3>
          <div className="text-sm text-text-secondary whitespace-pre-wrap bg-surface-secondary/50 p-3 rounded border border-border-primary">
            {template.exampleOutput}
          </div>
        </ThemedCard>
      )}

      {/* Generate Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={onGenerate}
          disabled={generating}
          size="lg"
          className="bg-primary hover:bg-primary-light text-white"
        >
          {generating ? 'Generating...' : 'Generate 3 Variants →'}
        </Button>
      </div>
    </div>
  )
}
