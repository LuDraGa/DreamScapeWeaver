import { NextResponse } from 'next/server'
import type { Part, PartType } from '@/lib/types'
import { uid, sleep } from '@/lib/utils'
import { getPartType } from '@/lib/parts'
import { getTransform } from '@/lib/transforms'

export async function POST(request: Request) {
  try {
    const { sourcePart, targetType }: { sourcePart: Part; targetType: PartType } =
      await request.json()

    // Validate transform
    const transform = getTransform(sourcePart.type, targetType)
    if (!transform) {
      return NextResponse.json(
        { error: 'Invalid transform' },
        { status: 400 }
      )
    }

    // Mock generation (Task 3.2)
    await sleep(2000) // Simulate API delay

    const targetMeta = getPartType(targetType)
    const mockContent = generateMockContent(sourcePart, targetType, transform.transformType)

    const newPart: Part = {
      id: uid(),
      projectId: '', // Unsaved initially
      type: targetType,
      title: `${targetMeta.name} (from ${sourcePart.title})`,
      content: mockContent,
      metadata: {
        wordCount: mockContent.split(/\s+/).length,
        sourcePartId: sourcePart.id,
        transformType: transform.transformType,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(newPart)
  } catch (error) {
    console.error('Transform error:', error)
    return NextResponse.json(
      { error: 'Transform failed' },
      { status: 500 }
    )
  }
}

// Mock content generator
function generateMockContent(
  sourcePart: Part,
  targetType: PartType,
  transformType: string
): string {
  const snippets = sourcePart.content.slice(0, 200)

  const templates: Record<PartType, string> = {
    'dreamscape': `A compelling story seed:\n\n${snippets}\n\nThis narrative explores themes of mystery, conflict, and resolution.`,

    'synopsis': `LOGLINE:\nA gripping tale of discovery and consequence.\n\nSYNOPSIS:\n${snippets}\n\nACT I: Setup and inciting incident\nACT II: Rising tension and complications\nACT III: Climax and resolution`,

    'beat-sheet': `BEAT SHEET\n\n1. Opening Image: Character in their ordinary world\n2. Theme Stated: Core question posed\n3. Setup: ${snippets.slice(0, 100)}\n4. Catalyst: Everything changes\n5. Debate: Character hesitates\n6. Break into Two: Point of no return\n7. B Story: Emotional thread develops\n8. Fun and Games: Promise of the premise\n9. Midpoint: False victory or defeat\n10. Bad Guys Close In: Pressure mounts\n11. All Is Lost: Darkest moment\n12. Dark Night of the Soul: Internal reckoning\n13. Break into Three: Solution found\n14. Finale: Climax and resolution\n15. Final Image: New normal established`,

    'tiktok-script': `🎬 TIKTOK SCRIPT (60 seconds)\n\nHOOK (0-3s):\n"Wait until you hear what happened..."\n\nSETUP (3-15s):\n${snippets.slice(0, 100)}\n\nCONFLICT (15-45s):\nThings escalate. Tension builds. Plot twist incoming.\n\nRESOLUTION (45-60s):\nUnexpected ending that leaves viewers wanting more.\n\n#storytelling #storytime #truecrime`,

    'twitter-thread': `🧵 THREAD TIME\n\n1/ You won't believe what just happened. Buckle up for this one.\n\n2/ ${snippets.slice(0, 100)}\n\n3/ I know what you're thinking. But wait, it gets worse.\n\n4/ The plot twist? Nobody saw it coming.\n\n5/ Lessons learned: Trust your gut. Question everything.\n\n6/ What would you have done? Drop your takes below. 👇`,

    'linkedin-post': `Professional Insight: What This Experience Taught Me About Leadership\n\n${snippets.slice(0, 150)}\n\nKey Takeaways:\n• Critical thinking beats assumptions\n• Due diligence matters in every context  \n• Ethics and action go hand in hand\n\nThis situation reminded me that leadership isn't about having authority—it's about taking responsibility when it counts.\n\nWhat's a time you had to step up unexpectedly? 💼\n\n#Leadership #ProfessionalGrowth #EthicsInAction`,

    'youtube-script': `📺 YOUTUBE SCRIPT (8-12 minutes)\n\n[INTRO - 0:00]\n"Hey everyone, you're not going to believe the story I'm about to tell you..."\n\n[HOOK - 0:30]\nSet expectations, tease the twist.\n\n[SETUP - 1:00]\n${snippets}\n\n[RISING ACTION - 3:00]\nDeeper context. Stakes increase. Audience hooked.\n\n[CLIMAX - 6:00]\nThe revelation. The confrontation. Peak engagement.\n\n[RESOLUTION - 8:00]\nHow it ended. Lessons learned.\n\n[OUTRO - 10:00]\n"If you enjoyed this story, don't forget to like and subscribe..."`,

    'reddit-post': `So this just happened and I'm still processing.\n\n${snippets}\n\nI know this sounds made up, but I swear this is 100% real. I've got screenshots if anyone needs proof.\n\nEdit: Yes, I know what I'm doing. No, I'm not making this up.\n\nEdit 2: For everyone asking about [detail], here's the full context...\n\nTL;DR: ${sourcePart.title}`,

    'blog-article': `# ${sourcePart.title}\n\n${snippets}\n\n## The Backstory\n\nEvery compelling story has layers. This one is no exception.\n\n## What Happened Next\n\nThe situation escalated in ways nobody expected.\n\n## Lessons Learned\n\nLooking back, this experience taught me several things:\n\n1. **Trust your instincts** - If something feels off, investigate.\n2. **Document everything** - Evidence matters.\n3. **Take action** - Awareness without action is just voyeurism.\n\n## Final Thoughts\n\nThis experience changed how I view everyday situations...`,

    'scene-breakdown': `SCENE BREAKDOWN\n\nSCENE 1 - INT. HOME OFFICE - DAY\n${snippets.slice(0, 80)}\nEmotional tone: Frustration, discovery\nVisual elements: Computer screen, router blinking\n\nSCENE 2 - INT. NEIGHBOR'S HOUSE - DAY\nThe confrontation. Character revelation.\nEmotional tone: Shock, intrigue\n\nSCENE 3 - INT. BASEMENT - CONTINUOUS\nThe reveal. Monitors, evidence, moral complexity.\n\nSCENE 4 - INT. HOA MEETING - NIGHT\nClimax. Public confrontation. Justice served.`,

    'shot-list': `📹 SHOT LIST\n\nSEQ 001 - OPENING\nShot 1: Close-up on router, blinking lights\nShot 2: Medium on frustrated protagonist\nShot 3: POV of computer screen, device list\n\nSEQ 002 - CONFRONTATION\nShot 4: Wide establishing shot, neighbor's house\nShot 5: Two-shot, doorway conversation\nShot 6: Reverse angles for tension\n\nSEQ 003 - REVELATION\nShot 7: Pan across surveillance equipment\nShot 8: Close-ups on evidence documents\nShot 9: Reaction shots`,

    'cinematography-guide': `🎥 CINEMATOGRAPHY GUIDE\n\nCOLOR PALETTE:\n- Cool blues for tech/isolation\n- Warm yellows for revelation scenes\n- Desaturated for tension\n\nLIGHTING:\n- Natural lighting for authenticity\n- Harsh shadows for confrontation\n- Soft key light for emotional moments\n\nCAMERA MOVEMENT:\n- Handheld for discovery/urgency\n- Locked off for important reveals\n- Slow push-ins for building tension\n\nLENS CHOICES:\n- 35mm for intimate scenes\n- 50mm for neutral observation\n- 85mm for close-ups`,
  }

  return templates[targetType] || `[${transformType.toUpperCase()}] Generated ${targetType} content based on: ${sourcePart.title}\n\n${snippets}\n\n...transformed content would appear here...`
}
