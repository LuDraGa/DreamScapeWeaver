# Planning: AI Video Scene Prompts Template

## Problem

Users want to generate scene descriptions that can be directly used as prompts for AI video generation models (Seedance 2.0, Kling, Runway Gen-4.5). Currently StoryWeaver has no template for this — the video-production category has shot lists, storyboards, etc. for human crews, but nothing for AI video models.

## Research Summary

### What video models expect as input

**Seedance 2.0** (user's preferred model):
- **30-80 words per shot** — shorter structured prompts outperform long descriptions
- **Formula**: Subject + Action + Camera + Scene + Style + Constraints
- **One action per shot** — generates 4-15 second clips
- Present tense, active voice
- Camera direction is the biggest quality lever (shot size, angle, movement, stability)
- Quality keywords appended at end: "4K, cinematic, sharp clarity, stable picture"
- NO negative prompts — describe what you want, not what to avoid
- Specific > vague: "a woman in a red wool coat walks through falling snow on cobblestone" not "a person walking outside"

**Cross-model universal rules**:
1. One action per shot (all models generate 4-15s clips)
2. Camera direction is critical (shot size + angle + movement)
3. Present tense, active voice
4. Explicit motion intensity (slowly, dramatically, gently)
5. Style anchoring (cinematic, documentary, commercial, anime)
6. Quality keywords at end

### Key insight for template design

The template output is NOT a story — it's a **shot sequence** of 8-12 individual prompts, each ready to paste directly into a video model. The dreamscape (story seed) provides the narrative concept, and the template breaks it into cinematic shots.

## Proposed Template

### Template Identity

| Field | Value |
|-------|-------|
| `id` | `"video-ai-scene-prompts"` |
| `displayName` | `"AI Video Scenes"` |
| `category` | `"video-production"` |
| `icon` | `"🎬"` |
| `description` | `"Scene-by-scene video prompts optimized for AI video models (Seedance, Kling, Runway)"` |
| `duration` | `"8-12 shots"` |
| `wordCount` | `800` (total across all shots, ~60-80 words each) |
| `platforms` | `["tiktok", "instagram-reels", "youtube-shorts", "youtube"]` |

### Settings

```json
{
  "tone": "script",
  "genres": ["visual", "cinematic"],
  "avoidPhrases": []
}
```

No avoidPhrases needed — video prompts are technical, not narrative.

### Seed Prompt (XML)

The seed generation for this template is unique: instead of narrative story seeds, we need **visual scene concepts** — cinematic moments that would make compelling video sequences.

**System**: Expert visual storyteller who designs cinematic scene concepts with strong visual potential. Focuses on movement, lighting, environment, and emotion that translate well to AI video generation.

**User**: Generate {count} visual scene concepts. Each should describe a cinematic moment with subject, environment, lighting, and implied movement.

### Style Variants

Three variants based on video model optimization:

1. **Seedance Optimized** — 30-80 words per shot, Subject+Action+Camera+Style formula, quality tags appended
2. **Cinematic** — Longer, more atmospheric descriptions with emphasis on lighting and color grading
3. **Fast-Paced** — Quick cuts, dynamic camera movements, high energy, shorter shots

### Story Generation (`promptTemplate`)

**System prompt**: Expert cinematographer + AI video prompt engineer. Breaks narrative concepts into shot-by-shot video prompts optimized for AI generation models. Each shot is a self-contained prompt.

**User prompt**: Takes the dreamscape (story seed) and outputs a numbered shot sequence where each shot follows:
```
SHOT [N] — [beat label]
[30-80 word prompt: subject + action + camera + scene + style + quality]
```

### Self-Check Rubric

- Does each shot have exactly ONE clear action?
- Are camera directions specific? (shot size + angle + movement)
- Is each shot 30-80 words?
- Are quality keywords present? (4K, cinematic, etc.)
- Could each shot be pasted directly into Seedance/Kling/Runway?
- Does the sequence tell a coherent visual story?
- Are motion intensity words explicit? (slowly, gently, dramatically)

### Few-Shot Excerpt

Show 3 example shots demonstrating the format:
```
SHOT 1 — ESTABLISHING
Wide shot, slow dolly forward through morning fog on an empty pier. A lone figure in a dark coat stands at the far end, facing the ocean. Golden hour light filters through mist. Cinematic, 4K, atmospheric, stable picture.

SHOT 2 — CLOSE-UP
Close-up of the figure's hands gripping the wooden railing, knuckles white. Camera slowly tilts up to reveal their face, eyes closed, breathing deeply. Soft backlight from rising sun. Cinematic, shallow depth of field, 4K.

SHOT 3 — REVEAL
Medium shot from behind the figure. Camera orbits slowly to reveal what they're looking at — a small sailboat anchored just offshore with a lantern still lit. Gentle handheld movement. Golden hour, cinematic, 4K.
```

### Character Prompt — NOT USED

No characterPrompt for this template. Video prompts describe scenes, not character voices.

### Compatibility

```json
{
  "perfectMatch": ["visual", "scene", "cinematic", "video", "shot"],
  "goodFit": ["dramatic", "atmospheric", "action", "moment", "sequence"],
  "checkType": "story-based",
  "dreamscapeTypes": ["visual", "narrative", "action", "atmospheric"]
}
```

## Key Design Decisions

1. **Output format = paste-ready prompts**: Each shot is a self-contained prompt you can copy directly into Seedance 2.0. Not a script for humans.

2. **Shot sequence, not single prompt**: The template generates 8-12 shots that together tell a visual story. Each shot is one 4-15 second clip.

3. **Seedance-first optimization**: Since the user prefers Seedance 2.0, the default format follows their Subject+Action+Camera+Style+Quality formula. Style variants can optimize for other models.

4. **Category = video-production**: Fits naturally alongside existing shot-list, storyboard, etc. templates. The distinction is that this generates AI model input, not human crew documents.

5. **seedPrompt generates visual concepts**: Unlike narrative templates that generate story conflicts, this template's seeds should describe cinematic visual moments with strong movement, lighting, and emotion potential.

## File Changes

| File | Change |
|------|--------|
| `src/config/templates/video-production/ai-scene-prompts.json` | **NEW** — full hero template |
| `execution_docs/_active/execution.md` | Track progress |

## Questions / Alternatives Considered

- **Should we add model-specific style variants?** (Seedance vs Kling vs Runway) — Proposed yes, as style variants. The Seedance variant is default since user prefers it.
- **Should it go in a new category like "ai-video"?** — No, video-production is the right home. The category system is about content type, not target audience.
- **Word count per shot vs total?** — Template wordCount is total (~800). Individual shot length (30-80 words) is enforced in the prompt constraints.
