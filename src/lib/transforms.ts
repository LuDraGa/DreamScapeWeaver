import type { PartType, TransformType } from './types'

/**
 * Transform Compatibility Map
 *
 * Defines which part types can be transformed into which other types,
 * and what kind of transformation it is.
 *
 * Transform Types:
 * - expand: Short → Long (TikTok → YouTube)
 * - condense: Long → Short (Blog → Twitter)
 * - remix: Same length, different format (Reddit → LinkedIn)
 * - extract: Pull concept out (YouTube → Dreamscape)
 * - format: Same content, different structure (Script → Scene)
 */

export interface Transform {
  sourceType: PartType
  targetType: PartType
  transformType: TransformType
  label: string // UI label: "Expand to YouTube script"
  description: string
}

/**
 * All valid transforms in the system.
 * This is the source of truth for what transformations are possible.
 */
export const TRANSFORMS: Transform[] = [
  // ============================================================
  // FROM: Dreamscape (foundation)
  // ============================================================
  {
    sourceType: 'dreamscape',
    targetType: 'synopsis',
    transformType: 'format',
    label: 'Create synopsis',
    description: 'Convert dreamscape chunks into a structured synopsis',
  },
  {
    sourceType: 'dreamscape',
    targetType: 'beat-sheet',
    transformType: 'format',
    label: 'Create beat sheet',
    description: 'Extract story structure into a beat sheet',
  },
  {
    sourceType: 'dreamscape',
    targetType: 'tiktok-script',
    transformType: 'condense',
    label: 'Create TikTok script',
    description: 'Condense dreamscape into a 30-60s short video script',
  },
  {
    sourceType: 'dreamscape',
    targetType: 'youtube-script',
    transformType: 'expand',
    label: 'Create YouTube script',
    description: 'Expand dreamscape into a long-form video script',
  },
  {
    sourceType: 'dreamscape',
    targetType: 'reddit-post',
    transformType: 'expand',
    label: 'Create Reddit post',
    description: 'Expand dreamscape into a narrative Reddit post',
  },
  {
    sourceType: 'dreamscape',
    targetType: 'blog-article',
    transformType: 'expand',
    label: 'Create blog article',
    description: 'Expand dreamscape into a structured blog article',
  },

  // ============================================================
  // FROM: Synopsis
  // ============================================================
  {
    sourceType: 'synopsis',
    targetType: 'dreamscape',
    transformType: 'extract',
    label: 'Extract dreamscape',
    description: 'Break synopsis into dreamscape chunks',
  },
  {
    sourceType: 'synopsis',
    targetType: 'beat-sheet',
    transformType: 'format',
    label: 'Create beat sheet',
    description: 'Convert synopsis into structured beats',
  },
  {
    sourceType: 'synopsis',
    targetType: 'tiktok-script',
    transformType: 'condense',
    label: 'Create TikTok script',
    description: 'Condense synopsis into short video script',
  },

  // ============================================================
  // FROM: Beat Sheet
  // ============================================================
  {
    sourceType: 'beat-sheet',
    targetType: 'youtube-script',
    transformType: 'expand',
    label: 'Create YouTube script',
    description: 'Expand beat sheet into long-form video script',
  },
  {
    sourceType: 'beat-sheet',
    targetType: 'scene-breakdown',
    transformType: 'format',
    label: 'Create scene breakdown',
    description: 'Convert beats into detailed scenes',
  },

  // ============================================================
  // FROM: TikTok Script (short-form)
  // ============================================================
  {
    sourceType: 'tiktok-script',
    targetType: 'youtube-script',
    transformType: 'expand',
    label: 'Expand to YouTube script',
    description: 'Expand short script into long-form video',
  },
  {
    sourceType: 'tiktok-script',
    targetType: 'twitter-thread',
    transformType: 'remix',
    label: 'Adapt to Twitter thread',
    description: 'Remix script into tweet thread format',
  },
  {
    sourceType: 'tiktok-script',
    targetType: 'scene-breakdown',
    transformType: 'format',
    label: 'Create scene breakdown',
    description: 'Break script into production scenes',
  },
  {
    sourceType: 'tiktok-script',
    targetType: 'shot-list',
    transformType: 'format',
    label: 'Create shot list',
    description: 'Convert script into numbered shots',
  },

  // ============================================================
  // FROM: Twitter Thread
  // ============================================================
  {
    sourceType: 'twitter-thread',
    targetType: 'linkedin-post',
    transformType: 'remix',
    label: 'Adapt to LinkedIn',
    description: 'Remix thread into professional post',
  },
  {
    sourceType: 'twitter-thread',
    targetType: 'blog-article',
    transformType: 'expand',
    label: 'Expand to blog article',
    description: 'Expand thread into long-form article',
  },

  // ============================================================
  // FROM: LinkedIn Post
  // ============================================================
  {
    sourceType: 'linkedin-post',
    targetType: 'twitter-thread',
    transformType: 'condense',
    label: 'Condense to Twitter thread',
    description: 'Break post into tweet-sized chunks',
  },
  {
    sourceType: 'linkedin-post',
    targetType: 'blog-article',
    transformType: 'expand',
    label: 'Expand to blog article',
    description: 'Expand post into detailed article',
  },

  // ============================================================
  // FROM: YouTube Script (long-form)
  // ============================================================
  {
    sourceType: 'youtube-script',
    targetType: 'tiktok-script',
    transformType: 'condense',
    label: 'Condense to TikTok script',
    description: 'Extract key moments into short video',
  },
  {
    sourceType: 'youtube-script',
    targetType: 'twitter-thread',
    transformType: 'condense',
    label: 'Condense to Twitter thread',
    description: 'Break video script into tweet thread',
  },
  {
    sourceType: 'youtube-script',
    targetType: 'blog-article',
    transformType: 'remix',
    label: 'Adapt to blog article',
    description: 'Convert video script to written article',
  },
  {
    sourceType: 'youtube-script',
    targetType: 'scene-breakdown',
    transformType: 'format',
    label: 'Create scene breakdown',
    description: 'Break script into production scenes',
  },
  {
    sourceType: 'youtube-script',
    targetType: 'dreamscape',
    transformType: 'extract',
    label: 'Extract dreamscape',
    description: 'Pull core story concept from script',
  },

  // ============================================================
  // FROM: Reddit Post (long-form)
  // ============================================================
  {
    sourceType: 'reddit-post',
    targetType: 'tiktok-script',
    transformType: 'condense',
    label: 'Condense to TikTok script',
    description: 'Extract dramatic moments into short video',
  },
  {
    sourceType: 'reddit-post',
    targetType: 'twitter-thread',
    transformType: 'condense',
    label: 'Condense to Twitter thread',
    description: 'Break story into tweet thread',
  },
  {
    sourceType: 'reddit-post',
    targetType: 'linkedin-post',
    transformType: 'remix',
    label: 'Adapt to LinkedIn',
    description: 'Remix story for professional audience',
  },
  {
    sourceType: 'reddit-post',
    targetType: 'youtube-script',
    transformType: 'expand',
    label: 'Expand to YouTube script',
    description: 'Expand story into long-form video',
  },

  // ============================================================
  // FROM: Blog Article (long-form)
  // ============================================================
  {
    sourceType: 'blog-article',
    targetType: 'twitter-thread',
    transformType: 'condense',
    label: 'Condense to Twitter thread',
    description: 'Break article into key points thread',
  },
  {
    sourceType: 'blog-article',
    targetType: 'linkedin-post',
    transformType: 'condense',
    label: 'Condense to LinkedIn post',
    description: 'Extract key insights for LinkedIn',
  },
  {
    sourceType: 'blog-article',
    targetType: 'youtube-script',
    transformType: 'remix',
    label: 'Adapt to YouTube script',
    description: 'Convert article to video script format',
  },

  // ============================================================
  // FROM: Scene Breakdown (production)
  // ============================================================
  {
    sourceType: 'scene-breakdown',
    targetType: 'shot-list',
    transformType: 'format',
    label: 'Create shot list',
    description: 'Break scenes into numbered shots',
  },
  {
    sourceType: 'scene-breakdown',
    targetType: 'cinematography-guide',
    transformType: 'format',
    label: 'Create cinematography guide',
    description: 'Extract visual direction from scenes',
  },

  // ============================================================
  // FROM: Shot List (production)
  // ============================================================
  {
    sourceType: 'shot-list',
    targetType: 'cinematography-guide',
    transformType: 'expand',
    label: 'Create cinematography guide',
    description: 'Add lighting and visual direction to shots',
  },

  // ============================================================
  // FROM: Cinematography Guide (production)
  // ============================================================
  {
    sourceType: 'cinematography-guide',
    targetType: 'shot-list',
    transformType: 'extract',
    label: 'Extract shot list',
    description: 'Pull camera specs from cinematography guide',
  },
]

/**
 * Get all valid target types for a given source part type
 */
export function getValidTargetTypes(sourceType: PartType): PartType[] {
  return TRANSFORMS.filter((t) => t.sourceType === sourceType).map((t) => t.targetType)
}

/**
 * Get all transforms from a source type
 */
export function getTransformsFrom(sourceType: PartType): Transform[] {
  return TRANSFORMS.filter((t) => t.sourceType === sourceType)
}

/**
 * Get a specific transform
 */
export function getTransform(sourceType: PartType, targetType: PartType): Transform | null {
  return TRANSFORMS.find((t) => t.sourceType === sourceType && t.targetType === targetType) || null
}

/**
 * Check if a transform is valid
 */
export function isValidTransform(sourceType: PartType, targetType: PartType): boolean {
  return getTransform(sourceType, targetType) !== null
}

/**
 * Get transforms by type (expand, condense, etc.)
 */
export function getTransformsByType(transformType: TransformType): Transform[] {
  return TRANSFORMS.filter((t) => t.transformType === transformType)
}
