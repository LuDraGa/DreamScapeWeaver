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
  category: 'foundation' | 'short-form' | 'long-form' | 'production'
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
    category: 'foundation',
    icon: '🌌',
    wordCount: { min: 50, max: 500 },
    description: 'Story seed with multiple chunks that can be enhanced or expanded',
  },

  synopsis: {
    id: 'synopsis',
    name: 'Synopsis',
    category: 'foundation',
    icon: '📝',
    wordCount: { min: 100, max: 300 },
    description: 'Concise story summary with key plot points',
  },

  'beat-sheet': {
    id: 'beat-sheet',
    name: 'Beat Sheet',
    category: 'foundation',
    icon: '📋',
    wordCount: { min: 200, max: 500 },
    description: 'Structured outline with story beats and turning points',
  },

  // ============================================================
  // Short-Form Content
  // ============================================================
  'tiktok-script': {
    id: 'tiktok-script',
    name: 'TikTok Script',
    category: 'short-form',
    icon: '📱',
    wordCount: { min: 50, max: 150 },
    duration: '30s-60s',
    description: 'Short-form vertical video script for TikTok, Reels, or Shorts',
  },

  'twitter-thread': {
    id: 'twitter-thread',
    name: 'Twitter Thread',
    category: 'short-form',
    icon: '🐦',
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

  // ============================================================
  // Long-Form Content
  // ============================================================
  'youtube-script': {
    id: 'youtube-script',
    name: 'YouTube Script',
    category: 'long-form',
    icon: '🎥',
    wordCount: { min: 1200, max: 3000 },
    duration: '8-20min',
    description: 'Long-form video script with hooks, acts, and call-to-action',
  },

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

  // ============================================================
  // Video Production Parts
  // ============================================================
  'scene-breakdown': {
    id: 'scene-breakdown',
    name: 'Scene Breakdown',
    category: 'production',
    icon: '🎬',
    wordCount: { min: 500, max: 1500 },
    description: 'Detailed scene-by-scene breakdown with acts, locations, and transitions',
  },

  'shot-list': {
    id: 'shot-list',
    name: 'Shot List',
    category: 'production',
    icon: '📹',
    wordCount: { min: 300, max: 1000 },
    description: 'Numbered shot list with camera specs, angles, and movements',
  },

  'cinematography-guide': {
    id: 'cinematography-guide',
    name: 'Cinematography Guide',
    category: 'production',
    icon: '🎨',
    wordCount: { min: 400, max: 1200 },
    description: 'Visual direction guide with lighting, color grading, and composition',
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
