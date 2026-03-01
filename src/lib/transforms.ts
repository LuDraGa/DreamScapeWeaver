import type { PartType, TransformType } from './types'
import { PART_TYPES, getPartType } from './parts'

/**
 * Transform Compatibility System
 *
 * Defines which part types can be transformed into which other types.
 * Uses intelligent rules rather than exhaustive mappings.
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
 * Category Transform Rules
 *
 * Defines which categories can transform to which other categories.
 * This creates a flexible, scalable transform system.
 */
const CATEGORY_TRANSFORM_RULES = {
  // Text Foundations can expand to ANY other category
  'text-foundations': {
    'text-foundations': ['format', 'extract'],
    'short-form': ['condense', 'format'],
    'long-form': ['expand', 'format'],
    'video-production': ['format', 'expand'],
    'audio-production': ['format', 'expand'],
    'marketing': ['format', 'condense'],
  },

  // Short-form can expand or remix to most categories
  'short-form': {
    'text-foundations': ['extract'],
    'short-form': ['remix'],
    'long-form': ['expand'],
    'video-production': ['format'],
    'audio-production': ['format'],
    'marketing': ['remix'],
  },

  // Long-form can condense or remix to most categories
  'long-form': {
    'text-foundations': ['extract'],
    'short-form': ['condense'],
    'long-form': ['remix'],
    'video-production': ['format', 'expand'],
    'audio-production': ['format', 'expand'],
    'marketing': ['condense', 'remix'],
  },

  // Video production can stay within video or export to other formats
  'video-production': {
    'text-foundations': ['extract'],
    'short-form': ['extract', 'condense'],
    'long-form': ['extract', 'expand'],
    'video-production': ['format'],
    'audio-production': ['format'],
    'marketing': ['extract'],
  },

  // Audio production can stay within audio or export to other formats
  'audio-production': {
    'text-foundations': ['extract'],
    'short-form': ['extract', 'condense'],
    'long-form': ['extract', 'expand'],
    'video-production': ['format'],
    'audio-production': ['format'],
    'marketing': ['extract'],
  },

  // Marketing can adapt to most categories
  'marketing': {
    'text-foundations': ['extract'],
    'short-form': ['condense', 'remix'],
    'long-form': ['expand', 'remix'],
    'video-production': ['format'],
    'audio-production': ['format'],
    'marketing': ['remix'],
  },
} as const

/**
 * Generate all valid transforms based on category rules
 */
function generateTransforms(): Transform[] {
  const transforms: Transform[] = []
  const allPartTypes = Object.values(PART_TYPES)

  for (const sourceMeta of allPartTypes) {
    const sourceCategory = sourceMeta.category
    const rules = CATEGORY_TRANSFORM_RULES[sourceCategory]

    if (!rules) continue

    for (const targetMeta of allPartTypes) {
      // Skip self-transforms
      if (sourceMeta.id === targetMeta.id) continue

      const targetCategory = targetMeta.category
      const allowedTransformTypes = rules[targetCategory]

      if (!allowedTransformTypes || allowedTransformTypes.length === 0) continue

      // Determine best transform type based on word counts
      const transformType = determineTransformType(
        sourceMeta,
        targetMeta,
        allowedTransformTypes
      )

      transforms.push({
        sourceType: sourceMeta.id,
        targetType: targetMeta.id,
        transformType,
        label: generateLabel(sourceMeta.name, targetMeta.name, transformType),
        description: generateDescription(sourceMeta.name, targetMeta.name, transformType),
      })
    }
  }

  return transforms
}

/**
 * Determine transform type based on word counts and category rules
 */
function determineTransformType(
  source: typeof PART_TYPES[keyof typeof PART_TYPES],
  target: typeof PART_TYPES[keyof typeof PART_TYPES],
  allowedTypes: readonly TransformType[]
): TransformType {
  const sourceAvg = (source.wordCount.min + source.wordCount.max) / 2
  const targetAvg = (target.wordCount.min + target.wordCount.max) / 2

  // If only one allowed type, use it
  if (allowedTypes.length === 1) return allowedTypes[0]

  // Word count based heuristics
  if (targetAvg > sourceAvg * 1.5 && allowedTypes.includes('expand')) {
    return 'expand'
  }
  if (targetAvg < sourceAvg * 0.7 && allowedTypes.includes('condense')) {
    return 'condense'
  }
  if (source.category === target.category && allowedTypes.includes('format')) {
    return 'format'
  }
  if (allowedTypes.includes('remix')) {
    return 'remix'
  }
  if (allowedTypes.includes('extract')) {
    return 'extract'
  }

  // Fallback to first allowed type
  return allowedTypes[0]
}

/**
 * Generate human-readable label for transform
 */
function generateLabel(sourceName: string, targetName: string, type: TransformType): string {
  const verbs: Record<TransformType, string> = {
    expand: 'Expand to',
    condense: 'Condense to',
    remix: 'Adapt to',
    extract: 'Extract to',
    format: 'Format as',
  }
  return `${verbs[type]} ${targetName}`
}

/**
 * Generate description for transform
 */
function generateDescription(
  sourceName: string,
  targetName: string,
  type: TransformType
): string {
  const templates: Record<TransformType, string> = {
    expand: `Expand ${sourceName} into ${targetName} format`,
    condense: `Condense ${sourceName} into ${targetName} format`,
    remix: `Adapt ${sourceName} to ${targetName} format`,
    extract: `Extract ${targetName} from ${sourceName}`,
    format: `Reformat ${sourceName} as ${targetName}`,
  }
  return templates[type]
}

/**
 * All valid transforms in the system (generated from rules)
 */
export const TRANSFORMS: Transform[] = generateTransforms()

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
