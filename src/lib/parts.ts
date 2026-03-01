import type { PartType } from './types'

/**
 * Part Type Registry
 *
 * Defines metadata for all content part types in the Studio system.
 * Each part type has:
 * - name: Display name
 * - category: Grouping for UI
 * - icon: Emoji for visual identification
 * - wordCount: Typical word count range
 * - duration: Typical duration (for video/audio content)
 * - description: What this part type is for
 */

export interface PartTypeMetadata {
  id: PartType
  name: string
  category: 'text-foundations' | 'short-form' | 'long-form' | 'video-production' | 'audio-production' | 'marketing'
  icon: string
  wordCount: { min: number; max: number }
  duration?: string
  description: string
}

export const PART_TYPES: Record<PartType, PartTypeMetadata> = {
  // ============================================================
  // Text Foundations
  // ============================================================
  dreamscape: {
    id: 'dreamscape',
    name: 'Dreamscape',
    category: 'text-foundations',
    icon: '🌌',
    wordCount: { min: 50, max: 500 },
    description: 'Story seed with multiple chunks that can be enhanced or expanded',
  },

  logline: {
    id: 'logline',
    name: 'Logline',
    category: 'text-foundations',
    icon: '💡',
    wordCount: { min: 20, max: 50 },
    description: 'One-sentence story pitch with protagonist, conflict, and stakes',
  },

  synopsis: {
    id: 'synopsis',
    name: 'Synopsis',
    category: 'text-foundations',
    icon: '📝',
    wordCount: { min: 100, max: 300 },
    description: 'Concise story summary with key plot points',
  },

  'beat-sheet': {
    id: 'beat-sheet',
    name: 'Beat Sheet',
    category: 'text-foundations',
    icon: '📋',
    wordCount: { min: 200, max: 500 },
    description: 'Structured outline with story beats and turning points',
  },

  'character-profiles': {
    id: 'character-profiles',
    name: 'Character Profiles',
    category: 'text-foundations',
    icon: '👤',
    wordCount: { min: 150, max: 400 },
    description: 'Detailed character backgrounds, motivations, and arcs',
  },

  'world-setting': {
    id: 'world-setting',
    name: 'World/Setting',
    category: 'text-foundations',
    icon: '🌍',
    wordCount: { min: 100, max: 300 },
    description: 'Environment, rules, and context where the story takes place',
  },

  'dialogue-snippets': {
    id: 'dialogue-snippets',
    name: 'Dialogue Snippets',
    category: 'text-foundations',
    icon: '💬',
    wordCount: { min: 50, max: 200 },
    description: 'Key conversations and character voice samples',
  },

  'theme-statement': {
    id: 'theme-statement',
    name: 'Theme Statement',
    category: 'text-foundations',
    icon: '🎯',
    wordCount: { min: 30, max: 100 },
    description: 'Core message or question the story explores',
  },

  'conflict-map': {
    id: 'conflict-map',
    name: 'Conflict Map',
    category: 'text-foundations',
    icon: '⚔️',
    wordCount: { min: 100, max: 250 },
    description: 'Internal and external conflicts driving the narrative',
  },

  'tone-document': {
    id: 'tone-document',
    name: 'Tone Document',
    category: 'text-foundations',
    icon: '🎨',
    wordCount: { min: 80, max: 200 },
    description: 'Emotional atmosphere, style, and narrative voice guidelines',
  },

  // ============================================================
  // Short-Form Content
  // ============================================================
  'reel-script': {
    id: 'reel-script',
    name: 'Reel Script',
    category: 'short-form',
    icon: '📱',
    wordCount: { min: 50, max: 150 },
    duration: '30s-90s',
    description: 'Instagram Reel script with hook, story, and CTA',
  },

  'tiktok-script': {
    id: 'tiktok-script',
    name: 'TikTok Script',
    category: 'short-form',
    icon: '🎵',
    wordCount: { min: 50, max: 150 },
    duration: '30s-60s',
    description: 'Short-form vertical video script for TikTok',
  },

  'twitter-thread': {
    id: 'twitter-thread',
    name: 'Twitter Thread',
    category: 'short-form',
    icon: '𝕏',
    wordCount: { min: 200, max: 400 },
    description: '8-15 tweet thread with hooks and engagement',
  },

  'linkedin-post': {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    category: 'short-form',
    icon: '💼',
    wordCount: { min: 200, max: 300 },
    description: 'Professional storytelling post for LinkedIn (1300-2000 chars)',
  },

  'instagram-caption': {
    id: 'instagram-caption',
    name: 'Instagram Caption',
    category: 'short-form',
    icon: '📸',
    wordCount: { min: 50, max: 200 },
    description: 'Engaging caption with story hooks and hashtags',
  },

  'youtube-short-script': {
    id: 'youtube-short-script',
    name: 'YouTube Short Script',
    category: 'short-form',
    icon: '▶️',
    wordCount: { min: 80, max: 150 },
    duration: '60s',
    description: 'Vertical short-form YouTube video script',
  },

  'podcast-teaser': {
    id: 'podcast-teaser',
    name: 'Podcast Teaser',
    category: 'short-form',
    icon: '🎙️',
    wordCount: { min: 50, max: 120 },
    duration: '30s-60s',
    description: 'Short audio hook for podcast episodes or trailers',
  },

  'email-preview': {
    id: 'email-preview',
    name: 'Email Preview',
    category: 'short-form',
    icon: '📧',
    wordCount: { min: 30, max: 80 },
    description: 'Subject line and preview text optimized for opens',
  },

  'ad-copy': {
    id: 'ad-copy',
    name: 'Ad Copy',
    category: 'short-form',
    icon: '🎯',
    wordCount: { min: 30, max: 100 },
    description: 'Paid ad copy for social or display advertising',
  },

  'quote-card': {
    id: 'quote-card',
    name: 'Quote Card',
    category: 'short-form',
    icon: '💭',
    wordCount: { min: 10, max: 40 },
    description: 'Shareable quote or insight for social graphics',
  },

  // ============================================================
  // Long-Form Content
  // ============================================================
  'reddit-post': {
    id: 'reddit-post',
    name: 'Reddit Post',
    category: 'long-form',
    icon: '🗨️',
    wordCount: { min: 500, max: 2000 },
    description: 'Narrative post for subreddits (AITAH, petty revenge, etc.)',
  },

  'blog-article': {
    id: 'blog-article',
    name: 'Blog Article',
    category: 'long-form',
    icon: '📰',
    wordCount: { min: 800, max: 2000 },
    description: 'SEO-optimized long-form article with structure',
  },

  'youtube-script': {
    id: 'youtube-script',
    name: 'YouTube Script',
    category: 'long-form',
    icon: '🎥',
    wordCount: { min: 1200, max: 3000 },
    duration: '8-20min',
    description: 'Long-form video script with hooks, acts, and call-to-action',
  },

  'podcast-script': {
    id: 'podcast-script',
    name: 'Podcast Script',
    category: 'long-form',
    icon: '🎙️',
    wordCount: { min: 1500, max: 4000 },
    duration: '20-60min',
    description: 'Full podcast episode script with segments and timing',
  },

  'short-story': {
    id: 'short-story',
    name: 'Short Story',
    category: 'long-form',
    icon: '📖',
    wordCount: { min: 1000, max: 5000 },
    description: 'Complete narrative story with beginning, middle, and end',
  },

  newsletter: {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'long-form',
    icon: '📬',
    wordCount: { min: 500, max: 1500 },
    description: 'Email newsletter with sections, stories, and CTAs',
  },

  'case-study': {
    id: 'case-study',
    name: 'Case Study',
    category: 'long-form',
    icon: '📊',
    wordCount: { min: 800, max: 2000 },
    description: 'Detailed success story with problem, solution, and results',
  },

  'white-paper': {
    id: 'white-paper',
    name: 'White Paper',
    category: 'long-form',
    icon: '📄',
    wordCount: { min: 1500, max: 4000 },
    description: 'Authoritative technical document with research and insights',
  },

  'documentary-narration': {
    id: 'documentary-narration',
    name: 'Documentary Narration',
    category: 'long-form',
    icon: '🎞️',
    wordCount: { min: 1000, max: 3000 },
    duration: '10-30min',
    description: 'Voiceover script for documentary-style video',
  },

  'video-essay': {
    id: 'video-essay',
    name: 'Video Essay',
    category: 'long-form',
    icon: '🎬',
    wordCount: { min: 1200, max: 3000 },
    duration: '10-25min',
    description: 'Analytical video script exploring ideas or media',
  },

  // ============================================================
  // Video Production Parts
  // ============================================================
  'scene-breakdown': {
    id: 'scene-breakdown',
    name: 'Scene Breakdown',
    category: 'video-production',
    icon: '🎬',
    wordCount: { min: 500, max: 1500 },
    description: 'Detailed scene-by-scene breakdown with acts, locations, and transitions',
  },

  'shot-list': {
    id: 'shot-list',
    name: 'Shot List',
    category: 'video-production',
    icon: '📹',
    wordCount: { min: 300, max: 1000 },
    description: 'Numbered shot list with camera specs, angles, and movements',
  },

  'cinematography-guide': {
    id: 'cinematography-guide',
    name: 'Cinematography Guide',
    category: 'video-production',
    icon: '🎨',
    wordCount: { min: 400, max: 1200 },
    description: 'Visual direction guide with lighting, color grading, and composition',
  },

  'storyboard-descriptions': {
    id: 'storyboard-descriptions',
    name: 'Storyboard Descriptions',
    category: 'video-production',
    icon: '🖼️',
    wordCount: { min: 300, max: 800 },
    description: 'Frame-by-frame visual descriptions for storyboarding',
  },

  'director-notes': {
    id: 'director-notes',
    name: "Director's Notes",
    category: 'video-production',
    icon: '🎯',
    wordCount: { min: 200, max: 600 },
    description: 'Creative vision, performance direction, and scene intentions',
  },

  'broll-cues': {
    id: 'broll-cues',
    name: 'B-Roll Cues',
    category: 'video-production',
    icon: '🎞️',
    wordCount: { min: 150, max: 500 },
    description: 'Supplemental footage list with timing and context',
  },

  'sound-design-notes': {
    id: 'sound-design-notes',
    name: 'Sound Design Notes',
    category: 'video-production',
    icon: '🔊',
    wordCount: { min: 200, max: 600 },
    description: 'Audio atmosphere, effects, and environmental sound cues',
  },

  'editing-beat-sheet': {
    id: 'editing-beat-sheet',
    name: 'Editing Beat Sheet',
    category: 'video-production',
    icon: '✂️',
    wordCount: { min: 300, max: 800 },
    description: 'Post-production timing, pacing, and cut suggestions',
  },

  'color-grade-palette': {
    id: 'color-grade-palette',
    name: 'Color Grade Palette',
    category: 'video-production',
    icon: '🌈',
    wordCount: { min: 150, max: 400 },
    description: 'Color grading mood board with references and LUT suggestions',
  },

  'vfx-requirements': {
    id: 'vfx-requirements',
    name: 'VFX Requirements',
    category: 'video-production',
    icon: '✨',
    wordCount: { min: 200, max: 700 },
    description: 'Visual effects shots with technical specs and references',
  },

  // ============================================================
  // Audio Production Parts
  // ============================================================
  'podcast-outline': {
    id: 'podcast-outline',
    name: 'Podcast Outline',
    category: 'audio-production',
    icon: '📋',
    wordCount: { min: 300, max: 800 },
    description: 'Episode structure with segments, topics, and timing',
  },

  'interview-questions': {
    id: 'interview-questions',
    name: 'Interview Questions',
    category: 'audio-production',
    icon: '❓',
    wordCount: { min: 100, max: 400 },
    description: 'Prepared questions with follow-ups and conversation flow',
  },

  'voiceover-script': {
    id: 'voiceover-script',
    name: 'Voiceover Script',
    category: 'audio-production',
    icon: '🎤',
    wordCount: { min: 200, max: 1000 },
    description: 'Narration script with pacing, emphasis, and timing notes',
  },

  'music-cues': {
    id: 'music-cues',
    name: 'Music Cues',
    category: 'audio-production',
    icon: '🎵',
    wordCount: { min: 100, max: 300 },
    description: 'Music placement, mood, and timing suggestions',
  },

  'sound-effects-list': {
    id: 'sound-effects-list',
    name: 'Sound Effects List',
    category: 'audio-production',
    icon: '🔔',
    wordCount: { min: 50, max: 200 },
    description: 'SFX catalog with timing and intensity specifications',
  },

  'ad-read-script': {
    id: 'ad-read-script',
    name: 'Ad Read Script',
    category: 'audio-production',
    icon: '📢',
    wordCount: { min: 80, max: 200 },
    description: 'Sponsorship read with talking points and disclaimers',
  },

  'intro-outro': {
    id: 'intro-outro',
    name: 'Intro/Outro',
    category: 'audio-production',
    icon: '🎬',
    wordCount: { min: 30, max: 100 },
    description: 'Opening and closing copy for audio content',
  },

  'show-notes': {
    id: 'show-notes',
    name: 'Show Notes',
    category: 'audio-production',
    icon: '📝',
    wordCount: { min: 200, max: 600 },
    description: 'Episode summary with timestamps, links, and resources',
  },

  transcript: {
    id: 'transcript',
    name: 'Transcript',
    category: 'audio-production',
    icon: '📜',
    wordCount: { min: 1000, max: 5000 },
    description: 'Full text transcription of audio content',
  },

  'audiogram-quotes': {
    id: 'audiogram-quotes',
    name: 'Audiogram Quotes',
    category: 'audio-production',
    icon: '🎧',
    wordCount: { min: 20, max: 80 },
    description: 'Shareable audio snippets with text overlay',
  },

  // ============================================================
  // Marketing/Commercial Parts
  // ============================================================
  'sales-page': {
    id: 'sales-page',
    name: 'Sales Page',
    category: 'marketing',
    icon: '💰',
    wordCount: { min: 800, max: 2500 },
    description: 'Conversion-focused landing page copy with social proof',
  },

  'product-description': {
    id: 'product-description',
    name: 'Product Description',
    category: 'marketing',
    icon: '🛍️',
    wordCount: { min: 100, max: 400 },
    description: 'Feature-benefit focused product copy with SEO',
  },

  'landing-page': {
    id: 'landing-page',
    name: 'Landing Page',
    category: 'marketing',
    icon: '🎯',
    wordCount: { min: 400, max: 1200 },
    description: 'Focused conversion page with hero, benefits, and CTA',
  },

  'email-sequence': {
    id: 'email-sequence',
    name: 'Email Sequence',
    category: 'marketing',
    icon: '📧',
    wordCount: { min: 600, max: 1500 },
    description: 'Multi-email drip campaign with storytelling and CTAs',
  },

  'social-calendar': {
    id: 'social-calendar',
    name: 'Social Calendar',
    category: 'marketing',
    icon: '📅',
    wordCount: { min: 500, max: 1500 },
    description: 'Content calendar with post ideas, themes, and scheduling',
  },

  'press-release': {
    id: 'press-release',
    name: 'Press Release',
    category: 'marketing',
    icon: '📰',
    wordCount: { min: 400, max: 800 },
    description: 'Official announcement in AP style with boilerplate',
  },

  'pitch-deck': {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    category: 'marketing',
    icon: '📊',
    wordCount: { min: 800, max: 2000 },
    description: 'Investor or sales deck narrative with slide-by-slide copy',
  },

  'testimonial-request': {
    id: 'testimonial-request',
    name: 'Testimonial Request',
    category: 'marketing',
    icon: '⭐',
    wordCount: { min: 100, max: 300 },
    description: 'Email or survey requesting customer feedback and reviews',
  },

  'faq-section': {
    id: 'faq-section',
    name: 'FAQ Section',
    category: 'marketing',
    icon: '❔',
    wordCount: { min: 300, max: 800 },
    description: 'Common questions and answers for objection handling',
  },

  'brand-story': {
    id: 'brand-story',
    name: 'Brand Story',
    category: 'marketing',
    icon: '🏢',
    wordCount: { min: 400, max: 1000 },
    description: 'Company origin narrative with mission and values',
  },
}

/**
 * Get part type metadata by ID
 */
export function getPartType(id: PartType): PartTypeMetadata {
  return PART_TYPES[id]
}

/**
 * Get all part types in a category
 */
export function getPartTypesByCategory(
  category: PartTypeMetadata['category']
): PartTypeMetadata[] {
  return Object.values(PART_TYPES).filter((pt) => pt.category === category)
}

/**
 * Get all part types
 */
export function getAllPartTypes(): PartTypeMetadata[] {
  return Object.values(PART_TYPES)
}
