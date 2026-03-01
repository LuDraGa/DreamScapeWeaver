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
import youtubeExplainer from '@/config/templates/long-form/youtube-explainer.json'
import youtubeStoryTime from '@/config/templates/long-form/youtube-story-time.json'
import youtubeDocumentary from '@/config/templates/long-form/youtube-documentary.json'

// Video Production templates
import sceneBreakdown from '@/config/templates/video-production/scene-breakdown.json'
import shotList from '@/config/templates/video-production/shot-list.json'
import cinematography from '@/config/templates/video-production/cinematography-guide.json'
import storyboard from '@/config/templates/video-production/storyboard.json'
import directorNotes from '@/config/templates/video-production/director-notes.json'
import brollList from '@/config/templates/video-production/broll-list.json'
import soundDesign from '@/config/templates/video-production/sound-design.json'
import editingGuide from '@/config/templates/video-production/editing-guide.json'
import colorPalette from '@/config/templates/video-production/color-palette.json'
import vfxRequirements from '@/config/templates/video-production/vfx-requirements.json'

// Audio Production templates
import podcastOutline from '@/config/templates/audio-production/podcast-outline.json'
import interviewQuestions from '@/config/templates/audio-production/interview-questions.json'
import voiceoverScript from '@/config/templates/audio-production/voiceover-script.json'
import musicCues from '@/config/templates/audio-production/music-cues.json'
import sfxList from '@/config/templates/audio-production/sfx-list.json'
import adRead from '@/config/templates/audio-production/ad-read.json'
import introOutro from '@/config/templates/audio-production/intro-outro.json'
import showNotes from '@/config/templates/audio-production/show-notes.json'
import transcript from '@/config/templates/audio-production/transcript.json'
import audiogram from '@/config/templates/audio-production/audiogram.json'

// Marketing templates
import salesPage from '@/config/templates/marketing/sales-page.json'
import productDescription from '@/config/templates/marketing/product-description.json'
import landingPage from '@/config/templates/marketing/landing-page.json'
import emailSequence from '@/config/templates/marketing/email-sequence.json'
import socialCalendar from '@/config/templates/marketing/social-calendar.json'
import pressRelease from '@/config/templates/marketing/press-release.json'
import pitchDeck from '@/config/templates/marketing/pitch-deck.json'
import testimonialRequest from '@/config/templates/marketing/testimonial-request.json'
import faq from '@/config/templates/marketing/faq.json'
import brandStory from '@/config/templates/marketing/brand-story.json'

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
  // Long-form templates
  youtubeExplainer,
  youtubeStoryTime,
  youtubeDocumentary,
  // Video Production templates
  sceneBreakdown,
  shotList,
  cinematography,
  storyboard,
  directorNotes,
  brollList,
  soundDesign,
  editingGuide,
  colorPalette,
  vfxRequirements,
  // Audio Production templates
  podcastOutline,
  interviewQuestions,
  voiceoverScript,
  musicCues,
  sfxList,
  adRead,
  introOutro,
  showNotes,
  transcript,
  audiogram,
  // Marketing templates
  salesPage,
  productDescription,
  landingPage,
  emailSequence,
  socialCalendar,
  pressRelease,
  pitchDeck,
  testimonialRequest,
  faq,
  brandStory,
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
  const dreamscapeText =
    dreamscape.chunks.length === 1
      ? dreamscape.chunks[0].text
      : dreamscape.chunks.map((c, i) => `[Fragment ${i + 1}]\n${c.text}`).join('\n\n')

  // Fragment stitching instructions (injected automatically when multiple fragments exist)
  const fragmentStitchingInstructions =
    dreamscape.chunks.length > 1
      ? `\n\n🔗 IMPORTANT - HANDLING MULTIPLE FRAGMENTS:
The story seed above contains ${dreamscape.chunks.length} [Fragment] sections. You MUST:
- Weave ALL fragments into ONE cohesive, chronological narrative
- Connect fragments smoothly with transitions, context, and logical flow
- Fill in necessary gaps between fragments to create seamless storytelling
- Treat fragments as key story beats in a single unified narrative
- If the complete story exceeds your target word count significantly, create a PART 1 that ends on a compelling cliffhanger/pause point, and note where PART 2 should begin
- DO NOT treat fragments as separate stories - they are pieces of ONE story\n`
      : ''

  // Replace variables in user prompt
  let userPrompt = template.promptTemplate.user
  userPrompt = userPrompt.replace('{dreamscape}', dreamscapeText + fragmentStitchingInstructions)
  userPrompt = userPrompt.replace('{avoidPhrases}', template.settings.avoidPhrases.join(', '))

  return {
    systemPrompt: template.promptTemplate.system,
    userPrompt,
  }
}
