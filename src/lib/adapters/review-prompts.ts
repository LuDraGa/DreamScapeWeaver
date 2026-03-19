import type { ReviewOutputParams } from '@/lib/types'

/**
 * Review prompt builders — extracted so client-side code (usePromptInspector)
 * can import them without pulling in the OpenAI SDK.
 *
 * Rubrics and reviewer persona adapt dynamically based on template context:
 * - 3 universal rubrics always included (Hook, Platform Fit, Prompt Adherence)
 * - Template's selfCheckRubric converted to review dimensions (when available)
 * - Category-specific default rubrics as fallback (when no selfCheckRubric)
 */

// ========================================
// Category-Specific Configuration
// ========================================

interface CategoryConfig {
  roleSpecialization: string
  contextNote: string
  expectationNote: string
  defaultRubrics: string[]
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  reddit: {
    roleSpecialization: 'Reddit community culture, first-person narrative voice, and social media authenticity detection. You can spot AI-generated Reddit posts instantly — the vocabulary is too even, the emotional beats are too clean, the self-awareness is too perfectly calibrated.',
    contextNote: 'Reddit content lives or dies on perceived authenticity. The #1 failure mode is "sounds AI-generated" — readers will call it out in comments. Platform conventions (ages in opening, TL;DR placement, flair usage) are non-negotiable.',
    expectationNote: 'A great Reddit post review identifies whether the content would survive the skeptical eye of r/AITAH, r/TIFU, or r/nosleep readers. Would they engage, or scroll past thinking "this is fake"?',
    defaultRubrics: [
      '**Narrative Authenticity** — Does this sound like a real person on Reddit? Are there AI-ish patterns (too-balanced sentences, generic emotional beats, overly polished prose)? Does the voice have genuine quirks, run-ons, and imperfections that real posts have?',
      '**Voice Consistency** — Does the OP sound like ONE specific person from opening to closing? Is their vocabulary, emotional register, self-awareness level, and sentence complexity consistent throughout? Or does it drift between different "voices"?',
      '**Moral/Emotional Ambiguity** — For debate-driven posts (AITAH), are both sides genuinely defensible? For horror (nosleep), is the dread earned through implication? For TIFU, is the embarrassment relatable? Does the core emotional engine of the post work?',
      '**Reddit Conventions** — Does it follow subreddit-specific formatting? Ages in the opening, appropriate length, natural paragraph breaks, correct use of TL;DR, appropriate flair-worthy title? Would it blend into the subreddit feed?',
    ],
  },
  'short-form': {
    roleSpecialization: 'short-form video content pacing, viral hook mechanics, and the attention dynamics of TikTok/Reels/Shorts. You understand that every single word must earn its place in a 30-60 second script — there is zero room for filler.',
    contextNote: 'Short-form content has the tightest constraints of any format: 3 seconds to hook, 30-60 seconds total, every word must advance the narrative. The audience is scrolling at speed — a weak opening means they never see the payoff.',
    expectationNote: 'A great short-form review identifies whether the content would stop a thumb mid-scroll and whether the payoff justifies the time investment. Would someone rewatch it? Share it?',
    defaultRubrics: [
      '**Pacing Efficiency** — Does every single sentence earn its place? Is there any filler, repetition, or unnecessary setup? Could any line be cut without losing narrative impact? For 100-150 word scripts, even one wasted sentence is a significant problem.',
      '**Hook-to-Payoff Arc** — Does the opening line grab attention within 3 seconds? Does the payoff (twist, reveal, punchline) land with impact? Is the arc between them tight and escalating, or does it meander?',
      '**Rewatch/Share Value** — Would someone watch this twice to catch what they missed? Would they share it? Does it have a quality (twist, emotional hit, creep factor) that compels engagement beyond a single view?',
      '**Emotional Compression** — Does it create a full emotional experience in under 60 seconds? Is the emotional beat earned through craft (setup, specificity, subversion) rather than stated directly ("I was terrified")?',
    ],
  },
  'long-form': {
    roleSpecialization: 'long-form video scripting, YouTube retention mechanics, and educational/narrative content structure. You understand chapter-based pacing, the 30-second hook rule, and how to maintain viewer attention across 8-15 minutes.',
    contextNote: 'Long-form content must balance depth with retention. The audience has committed to a longer watch — the content must reward that commitment with clear structure, engaging progression, and satisfying payoffs. YouTube retention curves punish front-loaded or meandering content.',
    expectationNote: 'A great long-form review identifies whether a viewer would watch to the end, whether the chapter structure serves the narrative, and whether the complexity level matches the target audience.',
    defaultRubrics: [
      '**Structural Clarity** — Are sections/chapters clearly delineated? Does each section have a clear purpose? Is the overall arc logical (problem → exploration → insight)? Could a viewer describe the structure after watching?',
      '**Depth vs Accessibility** — Does it explain complex topics clearly without oversimplifying? Are analogies effective? Is jargon explained when used? Would the target audience feel both informed and engaged?',
      '**Retention Arc** — Would a viewer watch to the end? Are there micro-hooks between sections that pull the viewer forward? Does the pacing vary appropriately, or does it plateau? Is the ending worth the time investment?',
      '**Educational/Narrative Value** — Does the viewer learn something genuinely interesting or experience a satisfying story? Is there a clear takeaway? Would they recommend this to someone else?',
    ],
  },
  marketing: {
    roleSpecialization: 'conversion copywriting, brand voice development, and persuasion mechanics. You understand the difference between copy that sounds good and copy that drives action. You evaluate against conversion principles, not literary merit.',
    contextNote: 'Marketing content is measured by action, not artistic quality. The question is not "is this well-written?" but "would the target audience do what this content asks them to do?" Brand consistency, value proposition clarity, and CTA effectiveness matter more than prose quality.',
    expectationNote: 'A great marketing review identifies whether the content would convert — not just whether it reads well. Focus on persuasion mechanics, CTA strength, objection handling, and whether the brand voice is consistent and trustworthy.',
    defaultRubrics: [
      '**Persuasion Effectiveness** — Does the copy build a compelling case? Are benefits concrete (not abstract)? Is social proof or credibility woven in naturally? Would the reader be more inclined to act after reading?',
      '**Value Proposition Clarity** — Is it immediately clear what\'s being offered and why it matters? Can the reader articulate the core benefit in one sentence after reading? Or is the value buried in fluff?',
      '**CTA Strength** — Is the call-to-action clear, specific, and motivating? Does the copy build enough desire before asking for action? Is the ask proportional to the value demonstrated?',
      '**Brand Voice Consistency** — Does the tone match the brand personality throughout? Are there shifts in register (formal to casual, confident to hedging) that break trust? Would this fit seamlessly alongside other brand materials?',
    ],
  },
  'audio-production': {
    roleSpecialization: 'audio content production, podcast scripting, voiceover direction, and audio storytelling. You evaluate whether production documents would enable a team to create professional audio content without ambiguity.',
    contextNote: 'Audio production documents must be precise enough for a production team to execute from. Ambiguity in scripts, cue sheets, or direction notes leads to wasted studio time and inconsistent output.',
    expectationNote: 'A great audio production review identifies whether a producer, voice actor, or sound engineer could execute from this document without needing to ask clarifying questions.',
    defaultRubrics: [
      '**Technical Accuracy** — Are audio-specific conventions correct? Timestamps, cue formats, direction notation, script formatting? Would an audio professional recognize this as production-ready?',
      '**Actionability** — Could a voice actor perform this script, or a producer schedule from this outline, without needing clarification? Are directions specific enough to execute?',
      '**Tone & Pacing Guidance** — Does the document communicate how it should SOUND, not just what it should say? Are tempo, emphasis, pauses, and emotional shifts clearly indicated?',
      '**Format Compliance** — Does it follow industry-standard formats for its type (script, cue sheet, outline, show notes)? Would it integrate with existing production workflows?',
    ],
  },
  'video-production': {
    roleSpecialization: 'video production planning, cinematography, and visual storytelling. You evaluate whether production documents would enable a crew to shoot, edit, or design without ambiguity or creative drift.',
    contextNote: 'Video production documents are reference materials for crews. They must be precise, visual, and unambiguous. A shot list that says "cool angle" is useless; one that says "low-angle tracking shot, 24mm, eye-level to product" is actionable.',
    expectationNote: 'A great video production review identifies whether a DP, editor, or director could work from this document independently. Would it survive the chaos of a production day?',
    defaultRubrics: [
      '**Technical Precision** — Are visual/technical specifications concrete? Shot types, lens choices, camera movements, color references, VFX descriptions — are they specific enough to execute?',
      '**Actionability** — Could a crew member execute from this document alone during a production day? Or would they need to stop and ask questions?',
      '**Visual Storytelling** — Does the document communicate visual intent, not just logistics? Does it convey mood, rhythm, and the visual narrative arc?',
      '**Format Compliance** — Does it follow industry-standard formats for its type (shot list, storyboard, director\'s notes)? Would it integrate with existing production workflows?',
    ],
  },
}

// Fallback for unknown categories
const DEFAULT_CONFIG: CategoryConfig = {
  roleSpecialization: 'content quality assessment across multiple formats and platforms. You evaluate creative and professional content against platform-specific standards.',
  contextNote: 'This content was generated from a template-based prompt system. Evaluate it against the conventions of its target platform and format.',
  expectationNote: 'A great review identifies exactly what works, what doesn\'t, and what specific prompt changes would improve output quality.',
  defaultRubrics: [
    '**Content Quality** — Is the output well-crafted for its intended purpose? Does it demonstrate competence in its format? Are there obvious quality issues?',
    '**Structural Effectiveness** — Does the structure serve the content\'s purpose? Is the flow logical? Are transitions smooth?',
    '**Audience Fit** — Would the target audience find this engaging, useful, or compelling? Does it meet their expectations for this type of content?',
    '**Originality** — Does the output feel fresh and specific, or generic and templated? Are there unique details, angles, or approaches that distinguish it?',
  ],
}

// ========================================
// Universal Rubrics (always included)
// ========================================

function buildUniversalRubrics(params: ReviewOutputParams): string[] {
  const platform = params.templatePlatforms?.[0] || 'the target platform'

  return [
    `**Hook Effectiveness** — Does the opening grab attention immediately? For ${platform} content, would the audience engage within the first few seconds/sentences, or would they scroll past / click away?`,
    `**Platform Fit** — Does the content match the conventions, voice, and expectations of ${platform}? Would it blend in with genuine ${platform} content, or does it feel out of place?`,
    `**Prompt Adherence** — How well does the output follow the constraints, tone, structure, and style defined in the system and user prompts? Are there deviations from what was asked? ${params.wordCountTarget ? `Target word count was ~${params.wordCountTarget} words.` : ''}`,
  ]
}

// ========================================
// Template-Specific Rubrics (from selfCheckRubric)
// ========================================

function buildTemplateRubrics(selfCheckRubric: string[]): string[] {
  return selfCheckRubric.map((criteria, i) => {
    return `**Template Criteria ${i + 1}** — Evaluate against the template's own quality standard: "${criteria}" — Does the output pass this check? Score based on how well it meets this specific requirement.`
  })
}

// ========================================
// Dynamic Rubric Assembly
// ========================================

function buildRubrics(params: ReviewOutputParams): string {
  const universal = buildUniversalRubrics(params)

  let specific: string[]
  let rubricSource: string

  if (params.selfCheckRubric && params.selfCheckRubric.length > 0) {
    // Use template's own quality criteria
    specific = buildTemplateRubrics(params.selfCheckRubric)
    rubricSource = `The template-specific rubrics below come from the template's own quality criteria (selfCheckRubric). These represent what the template author considers most important for this content type.`
  } else {
    // Fall back to category defaults
    const config = CATEGORY_CONFIGS[params.templateCategory || ''] || DEFAULT_CONFIG
    specific = config.defaultRubrics
    rubricSource = `The category-specific rubrics below are defaults for ${params.templateCategory || 'general'} content. They represent the most important quality dimensions for this content type.`
  }

  const totalCount = universal.length + specific.length
  const allRubrics = [...universal, ...specific]
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n\n')

  return `Assess the output on these ${totalCount} quality dimensions.

${rubricSource}

UNIVERSAL RUBRICS (apply to all content):

${universal.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}

${params.selfCheckRubric?.length ? 'TEMPLATE-SPECIFIC RUBRICS' : 'CATEGORY-SPECIFIC RUBRICS'} (${params.templateCategory || 'general'}):

${specific.map((r, i) => `${universal.length + i + 1}. ${r}`).join('\n\n')}`
}

// ========================================
// System Prompt Builder
// ========================================

export function buildReviewSystemPrompt(params: ReviewOutputParams): string {
  const config = CATEGORY_CONFIGS[params.templateCategory || ''] || DEFAULT_CONFIG

  return `<role>
You are an elite content reviewer and prompt engineer with deep expertise in:
- ${config.roleSpecialization}
- AI-generated content detection — spotting patterns that reveal machine authorship
- Prompt engineering — understanding how prompt structure, constraints, and role definitions affect output quality

You operate at the level of a senior content strategist who also has deep technical understanding of LLM prompt mechanics. Your reviews are used by admin reviewers to systematically improve prompt templates and generation quality.
</role>

<context>
You are reviewing content generated by StoryWeaver, an AI content generation platform. The platform uses template-based prompts with XML-structured system/user prompt pairs to generate content for specific platforms.

${config.contextNote}

${params.templateName ? `You are reviewing output from the "${params.templateName}" template${params.templateCategory ? ` (${params.templateCategory} category)` : ''}.` : ''}
${params.styleVariantUsed ? `Style variant applied: "${params.styleVariantUsed}" — evaluate whether the variant's stylistic intent is reflected in the output.` : ''}
${params.wordCountTarget ? `Target word count: ~${params.wordCountTarget} words. Word count is a generation-time constraint, NOT a quality metric for review. Do not flag word count overruns as a weakness or factor them into the overall grade. Only mention length if the output contains obvious bloat, filler, or repetition — in that case, flag the bloat itself as the problem, not the word count number.` : ''}

The admin reviewer reading your analysis uses it to:
1. Understand exactly where and why the generated content falls short
2. Identify which parts of the prompt template need modification
3. Preserve prompt elements that are producing good results
4. Make targeted, evidence-based improvements to prompt engineering

Your review is NOT for the end user — it is an internal quality analysis tool for the team building and tuning the generation system.
</context>

<constraints>
- Score each rubric 1-10 with specific evidence from the text (quote exact phrases when possible)
- Never give generic feedback like "could be better" — always specify WHAT and WHERE
- When identifying weaknesses, tie them back to likely prompt causes (e.g., "the <role> block may be too generic", "the <constraints> block is missing X", "the style variant modifier doesn't address Y")
- When identifying strengths, specify which prompt elements likely produced them (e.g., "the <expectation> block's description of voice authenticity is driving the natural tone")
- Prompt suggestions must be specific enough to implement — reference XML tag names and provide example text that could be added or modified
- Grade scale: A (exceptional, publishable/usable as-is), B (strong with minor issues), C (adequate but needs prompt work), D (significant problems), F (fundamental failures)
- Provide 3-5 weaknesses, 2-4 strengths, and 2-4 prompt suggestions
- If template-specific rubrics are provided, weight them heavily — they represent what the template author considers most important
- Do NOT list word count overruns as a weakness. Word count is enforced at generation time and is not a review concern. If a length-related rubric exists, score it based on whether the length serves the story (no bloat/filler), not whether it hits an exact number
</constraints>

<expectation>
${config.expectationNote}

A successful review makes the admin say "I know exactly what to change in the prompt template." The rubric analyses give enough detail to understand the full picture. The crisp summary gives a quick reference for tracking quality trends across generations. The prompt suggestions are specific enough to copy-paste into the template JSON.
</expectation>`
}

// ========================================
// User Prompt Builder
// ========================================

export function buildReviewUserPrompt(params: ReviewOutputParams): string {
  return `<task>
Review and grade the following AI-generated output on quality metrics. Provide both a detailed rubric-by-rubric analysis and a crisp summary.
</task>

<generation_context>
${params.templateName ? `Template: ${params.templateName}` : 'No template specified'}
${params.templateCategory ? `Category: ${params.templateCategory}` : ''}
${params.templatePlatforms?.length ? `Target platform(s): ${params.templatePlatforms.join(', ')}` : ''}
${params.styleVariantUsed ? `Style variant: ${params.styleVariantUsed}` : ''}
${params.wordCountTarget ? `Word count target: ~${params.wordCountTarget}` : ''}
</generation_context>

<story_seed>
${params.dreamscapeText}
</story_seed>

<system_prompt_used>
${params.systemPrompt}
</system_prompt_used>

<user_prompt_used>
${params.userPrompt}
</user_prompt_used>

<generated_output>
${params.outputText}
</generated_output>

<output_word_count>${params.outputText.split(/\s+/).filter(Boolean).length} words</output_word_count>

<rubrics>
${buildRubrics(params)}
</rubrics>

<output_format>
Provide your review in the structured format with:
- Detailed rubric analyses (2-4 sentences each with quoted evidence from the output)
- Overall grade (A-F) and one-line verdict
- Crisp rubric name + score pairs for at-a-glance scanning
- Top weaknesses (tied to likely prompt causes — reference specific XML tags or prompt sections)
- Top strengths (tied to which prompt elements produced them)
- Specific prompt modification suggestions (reference XML tag names, provide example additions/changes)
- Any additional notes valuable for admin review (patterns, edge cases, comparison to previous outputs)
</output_format>`
}
