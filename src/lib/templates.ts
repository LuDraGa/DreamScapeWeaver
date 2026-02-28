import type { Template, TemplateCategory, TemplateCompatibility, Dreamscape } from './types'

// Import all template JSON files
import revengeStory from '@/config/templates/short-form/revenge-story.json'
import motivational from '@/config/templates/short-form/motivational.json'
import horrorCreepy from '@/config/templates/short-form/horror-creepy.json'
import unexpectedTwist from '@/config/templates/short-form/unexpected-twist.json'
import dramaConfession from '@/config/templates/short-form/drama-confession.json'
import lifeLesson from '@/config/templates/short-form/life-lesson.json'
import aitah from '@/config/templates/reddit/aitah.json'
import tifu from '@/config/templates/reddit/tifu.json'
import pettyRevenge from '@/config/templates/reddit/petty-revenge.json'
import nosleep from '@/config/templates/reddit/nosleep.json'
import wpSciFi from '@/config/templates/reddit/writing-prompts-scifi.json'
import wpFantasy from '@/config/templates/reddit/writing-prompts-fantasy.json'
import wpHorror from '@/config/templates/reddit/writing-prompts-horror.json'

// All templates
const ALL_TEMPLATES: Template[] = [
  // Short-form templates
  revengeStory,
  motivational,
  horrorCreepy,
  unexpectedTwist,
  dramaConfession,
  lifeLesson,
  // Reddit templates
  aitah,
  tifu,
  pettyRevenge,
  nosleep,
  wpSciFi,
  wpFantasy,
  wpHorror,
] as Template[]

/**
 * Get all templates
 */
export function getAllTemplates(): Template[] {
  return ALL_TEMPLATES
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return ALL_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id)
}

/**
 * Check dreamscape compatibility with template
 * Uses simple keyword matching - no LLM needed
 */
export function checkTemplateCompatibility(
  dreamscape: Dreamscape,
  template: Template
): TemplateCompatibility {
  // Combine all dreamscape text
  const text = dreamscape.chunks.map((c) => c.text).join(' ').toLowerCase()

  // Check for perfect matches
  const hasPerfectMatch = template.compatibility.perfectMatch.some((keyword) =>
    text.includes(keyword.toLowerCase())
  )

  if (hasPerfectMatch) {
    return { level: 'perfect' }
  }

  // Check for good fits
  const hasGoodFit = template.compatibility.goodFit.some((keyword) =>
    text.includes(keyword.toLowerCase())
  )

  if (hasGoodFit) {
    return { level: 'good' }
  }

  // Default: may need tweaking
  return {
    level: 'maybe',
    message: 'This template might work, but consider adjusting your dreamscape',
  }
}

/**
 * Sort templates by compatibility with dreamscape
 */
export function sortTemplatesByCompatibility(
  dreamscape: Dreamscape,
  templates: Template[]
): Template[] {
  return [...templates].sort((a, b) => {
    const compatA = checkTemplateCompatibility(dreamscape, a)
    const compatB = checkTemplateCompatibility(dreamscape, b)

    const levelOrder = { perfect: 0, good: 1, maybe: 2 }

    return levelOrder[compatA.level] - levelOrder[compatB.level]
  })
}

/**
 * Build prompt from template and dreamscape
 */
export function buildPromptFromTemplate(template: Template, dreamscape: Dreamscape): {
  systemPrompt: string
  userPrompt: string
} {
  // Get dreamscape text
  const dreamscapeText = dreamscape.chunks.map((c) => c.text).join('\n\n')

  // Replace variables in user prompt
  let userPrompt = template.promptTemplate.user
  userPrompt = userPrompt.replace('{dreamscape}', dreamscapeText)
  userPrompt = userPrompt.replace('{avoidPhrases}', template.settings.avoidPhrases.join(', '))

  return {
    systemPrompt: template.promptTemplate.system,
    userPrompt,
  }
}
