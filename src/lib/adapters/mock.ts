import type {
  GenerateDreamscapesParams,
  EnhanceDreamscapeParams,
  EnhanceDreamscapeResult,
  GenerateOutputsParams,
  Dreamscape,
  OutputVariant,
} from '@/lib/types'
import { uid, sleep } from '@/lib/utils'
import { buildEnhancementPrompt } from '@/lib/prompt-builders'

const MOCK_DREAMSCAPE_SEEDS = [
  "A middle-aged accountant discovers their neighbor has been stealing their Wi-Fi for years - but the neighbor is a retired CIA operative who's been using it to monitor the HOA president.",
  'Two best friends accidentally RSVP "yes" to the same exclusive dinner party, each claiming to be the other\'s plus-one. The host knows both of them.',
  "A barista starts leaving coded messages in latte art. Only one customer notices - and they're an off-duty detective going through a messy divorce.",
  "A woman finds her deceased grandmother's diary, revealing she had a secret penpal relationship with a famous author. The last letter contains a confession.",
  "Someone's smart home AI starts making passive-aggressive comments about their lifestyle choices. The twist: it might be the previous homeowner's ghost.",
  "A food critic with anosmia (no sense of smell) has been faking reviews for years. Their biggest fan is the chef they've been secretly rating highest.",
  "Two strangers keep getting each other's mail due to a postal error. They start communicating only through the margins of misdelivered letters.",
  "A therapist realizes their newest client is telling a story that exactly mirrors a novel the therapist wrote under a pseudonym - but never published.",
  "A dog walker discovers all their clients' dogs have been trained to respond to the same unusual whistle. The dogs belong to people who don't know each other.",
  "An Uber driver picks up the same passenger every Tuesday at 3am from a cemetery. The passenger always asks to be dropped at a children's hospital.",
]

const MOCK_STORIES = {
  balanced: `So this happened last week and I'm still processing it. I (34F) have been living next to "Greg" (60s M) for about six years. Nice enough guy, keeps to himself, waves when he's checking the mail. Normal neighbor stuff.

Anyway, I work from home and my internet has been garbage lately. I'm talking dropped Zoom calls during client presentations, buffering on everything. I called my ISP three times. They kept saying my signal was fine on their end.

My husband suggested I check how many devices were on our network. So I pulled up the router admin page and — twenty-seven devices. We own maybe eight.

I figured maybe it was a glitch, but then I saw device names. Things like "SIGINT-NODE-7" and "OVERWATCHTABLET." I am not making this up.

Long story short, I knocked on Greg's door. He opened it wearing reading glasses and a cardigan, looking like everyone's grandfather. I asked him point blank if he was using my WiFi. He didn't even flinch. Just said, "Come in, I'll make coffee. We should talk."

Turns out Greg is retired CIA. Not like, "I filed papers at Langley" retired. More like "I have a room in his basement with six monitors" retired. He's been using my network as a proxy because — and this is the part that broke my brain — he's been monitoring our HOA president, Sandra.

Apparently Sandra has been embezzling from the community fund. Greg noticed discrepancies in the annual report (because of course he reads those), and has been building a case. Using my WiFi so it couldn't be traced back to his address.

He showed me the evidence. Spreadsheets, transaction records, screenshots. Sandra has allegedly moved about $40K into a personal account over three years.

I asked why he didn't just report it. He said, "Old habits. I wanted an airtight case first." Then he handed me a check for $600 — "back-payment for bandwidth" — and asked if I wanted in on the takedown.

Reddit, I took the check. I'm going to the next HOA meeting. AITAH?`,

  intense: `I need to get this off my chest because I think I'm about to blow up my entire neighborhood and I don't even care anymore.

I (34F) have been LOSING IT over my internet for months. Dropped calls with clients. Lost a contract because my screen froze during a final pitch. My husband and I had actual fights about whether we should switch providers or move. MOVE. Over WiFi.

Then I found twenty-seven unknown devices on my network. Device names that looked like something out of a spy thriller. SIGINT-NODE-7. OVERWATCHTABLET. BLACKSITE-CAM-3.

I went next door ready to scream. Greg — quiet, cardigan-wearing, "have a nice day" Greg — opens the door and doesn't even TRY to deny it. Just invites me in like I'm expected.

His basement looks like a mission control room. Six monitors. A whiteboard with SANDRA written in red marker and connected to a web of names and dollar amounts. Post-it notes everywhere with timestamps.

Greg is ex-CIA. The real kind. The kind where he tells you with dead-calm eyes and you believe every word because something about the way he stands makes you realize he could neutralize you before you finished a sentence.

He's been running counter-intelligence on our HOA president. Sandra — sweet, "I brought cookies to the block party" Sandra — has been stealing $40,000 from our community fund.

Greg handed me $600 cash. "For the bandwidth." Then he slid a folder across the table and said five words that changed everything: "The next meeting is Thursday."

I took the money. I read the folder. And now I'm sitting in my car outside the community center with my heart pounding because in twenty minutes, I'm walking in there with enough evidence to destroy Sandra's entire life.

AITAH? Honestly, I don't care anymore. She stole from all of us.`,

  believable: `This is kind of mundane compared to most posts here but it's been bothering me and I want outside perspective.

I (34F) noticed our home internet was slow. Like, consistently slow for weeks. My husband thought it was our provider, and honestly I assumed the same until I happened to check our router's admin page for an unrelated reason.

There were a bunch of devices I didn't recognize connected to our network. Not like, two or three that could be a neighbor's phone accidentally connecting. A lot. Some had unusual names I didn't recognize.

I asked my husband, he had no idea. I asked my teen if she'd given the password to friends — nope. Process of elimination, I went next door.

Greg is in his 60s, retired, lives alone. We've always been friendly in a "wave from the driveway" kind of way. When I asked about the WiFi, he paused for a second, then just said yeah, he'd been using it. Apologized. Said his own internet got disconnected months ago during a billing dispute and he'd been meaning to sort it out.

Here's where it gets interesting. Over coffee (he insisted), he mentioned he'd been keeping an eye on some "discrepancies" in our HOA's financial reports. He used to work in government — something analytical, he was vague about it — and he'd noticed the numbers didn't add up. He'd been documenting it, partly as a habit, partly because he thought someone should.

He showed me what he'd found. I'm not a finance person but even I could tell some of the transactions looked off. The amounts were significant — potentially tens of thousands over a few years.

He offered to pay for the months of WiFi usage and gave me a check. He also asked if I'd be willing to bring this up at the next HOA meeting since he said he's "not great at the public confrontation part."

I deposited the check. I'm planning to go to the meeting. But now I'm second-guessing whether I should get more involved in what's essentially Greg's project. AITAH for taking the money and agreeing to help? Part of me feels like I should just let it go.`,
}

/**
 * Mock adapter for testing and fallback
 * Simulates API calls with delays
 */
export const mockAdapter = {
  async generateDreamscapes(params: GenerateDreamscapesParams): Promise<Dreamscape[]> {
    await sleep(1500 + Math.random() * 1000)
    const shuffled = [...MOCK_DREAMSCAPE_SEEDS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, params.count).map((text) => ({
      id: uid(),
      title: '',
      chunks: [{ id: uid(), title: '', text }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async enhanceDreamscape(params: EnhanceDreamscapeParams): Promise<EnhanceDreamscapeResult> {
    await sleep(2000 + Math.random() * 500)

    // Build prompt data for inspector
    const promptData = buildEnhancementPrompt({
      chunks: params.chunks,
      goalPreset: params.goalPreset,
      customGoal: params.customGoal,
      intensity: params.intensity,
      avoidPhrases: params.avoidPhrases,
    })

    const suffixes: Record<string, string> = {
      vivid:
        '\n\nThe fluorescent lights hummed overhead, casting everything in that sickly yellow-green tint that made even healthy skin look jaundiced. The coffee had gone cold hours ago, leaving a ring on the faux-wood desk.',
      conflict:
        '\n\nBut there\'s a catch - someone else knows. And they\'ve been watching, waiting for the right moment to make their move.',
      believable: ' (This actually happened to my coworker\'s sister, so I\'m changing some details.)',
      stitch: '',
      'less-ai': '',
      custom: `\n\n[Custom enhancement applied: ${params.customGoal || 'generic enhancement'}]`,
    }

    // Special case: stitch multiple chunks together
    if (params.goalPreset === 'stitch' && params.chunks.length > 1) {
      const combined = params.chunks.map((c) => c.text).join('\n\n---\n\n')
      return {
        stitchedSeed: `What started as two separate incidents ended up being connected in a way nobody expected.\n\n${combined}\n\nThe thing is - these aren't two stories. They're the same story from different angles.`,
        promptData,
      }
    }

    // Normal enhancement: append suffix to each chunk
    return {
      enhancedChunks: params.chunks.map((c) => ({
        ...c,
        id: uid(),
        text: c.text + (suffixes[params.goalPreset] || ''),
      })),
      promptData,
    }
  },

  async generateOutputs(params: GenerateOutputsParams): Promise<OutputVariant[]> {
    await sleep(2500 + Math.random() * 1000)

    // Check if this is a template-based generation (template IDs start with category prefix)
    const presetId = params.dialState.presetId ?? ''
    const isShortFormTemplate = presetId.startsWith('short-')
    const isRedditTemplate = presetId.startsWith('reddit-')
    const isLongFormTemplate = presetId.startsWith('long-')

    // Long-form video templates: return mock YouTube scripts
    if (isLongFormTemplate) {
      const mockYouTubeScript = `[INTRO - 0:00]
Ever wondered how your brain knows you're being simulated? Today we're diving deep into a fascinating discovery that challenges everything we thought we knew about consciousness and reality.

[SECTION 1: THE DISCOVERY - 1:30]
During a routine office building evacuation drill, an IT specialist accidentally accessed a hidden network. What they found would spark one of the most intriguing philosophical debates of our time.

The specialist, let's call them Alex, was running network diagnostics when they stumbled upon an unusual subnet. At first, it looked like a forgotten development environment. But upon closer inspection, it revealed something extraordinary: a virtual reality interface showing real-time simulations of every employee in the building.

[SECTION 2: HOW IT WORKS - 4:45]
To understand what this means, we need to break down three key concepts:

First, the simulation wasn't just tracking people—it was predicting their actions with uncanny accuracy. Every decision, every movement, modeled down to the millisecond.

Second, the system used a combination of behavioral algorithms and neural mapping. Think of it like a digital twin, but instead of just copying appearance, it copies thought patterns.

Third—and this is where it gets really interesting—the simulated versions seemed to exhibit emergent behaviors. They weren't just following scripts. They were making independent choices within the parameters of the simulation.

[SECTION 3: THE IMPLICATIONS - 8:20]
This raises profound questions about consciousness and free will. If a simulation can predict your actions perfectly, are you truly making free choices? Or are you following a predetermined pattern?

Philosophers call this the "simulation argument," but Alex's discovery adds a new twist: what if consciousness itself is the thing that breaks the simulation? What if the very act of discovering you're being simulated changes the outcome?

[CONCLUSION - 10:45]
So here's what we've learned: simulations can be incredibly sophisticated, but consciousness—the awareness of being aware—might be the variable that makes perfect prediction impossible.

The real question isn't whether we're living in a simulation. It's whether it even matters if we are.

Key takeaways:
- Simulations can model behavior with high accuracy
- Consciousness introduces unpredictability
- Self-awareness might be the ultimate firewall

If you found this fascinating, you might enjoy our video on quantum consciousness and observer effects. Link in the description.`

      return [
        {
          id: uid(),
          projectId: '',
          title: 'Variant A — Educational Focus',
          text: mockYouTubeScript,
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          projectId: '',
          title: 'Variant B — Story-Driven',
          text: mockYouTubeScript.replace('[INTRO - 0:00]', '[INTRO - 0:00]\nI need to tell you about the day everything changed.'),
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          projectId: '',
          title: 'Variant C — Documentary Style',
          text: mockYouTubeScript.replace('Ever wondered', 'On March 15th, 2023, an ordinary evacuation drill would reveal something extraordinary. The question we need to ask is'),
          createdAt: new Date().toISOString(),
        },
      ]
    }

    // Short-form video templates: return mock video scripts
    if (isShortFormTemplate) {
      const mockVideoScript = `[SETUP — Mundane start]
I was sitting in the office parking lot during a fire drill, scrolling my phone like everyone else. But our IT department is on the top floor, so I had my laptop with me.

[MISDIRECTION — Setup false narrative]
While everyone was complaining about the cold, I decided to run some network diagnostics. You know, typical IT nerd stuff. That's when I noticed a hidden subnet. Weird, but probably just an old dev environment someone forgot about.

[SUBTLE HINTS — Plant rewatchability clues]
I clicked through. There was a VR interface. Like… a full 3D simulation. And it had little avatars. I recognized one—it was Jim from accounting. Same tie, same coffee mug. Real-time.

[TWIST — Reframe everything]
Then I saw my own avatar. It was me, standing in the parking lot… holding my laptop…

…running network diagnostics.

[END — Let it land]`

      return [
        {
          id: uid(),
          projectId: '',
          title: 'Variant A — Balanced',
          text: mockVideoScript,
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          projectId: '',
          title: 'Variant B — More Intense',
          text: mockVideoScript.replace('[SETUP', '[INTENSE SETUP'),
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          projectId: '',
          title: 'Variant C — Subtle Version',
          text: mockVideoScript.replace('…running network diagnostics.', '…doing exactly what I\'m doing right now.'),
          createdAt: new Date().toISOString(),
        },
      ]
    }

    // Reddit templates or power user mode: return Reddit stories
    return [
      {
        id: uid(),
        projectId: '',
        title: 'Variant A — Balanced',
        text: MOCK_STORIES.balanced,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        projectId: '',
        title: 'Variant B — More Intense',
        text: MOCK_STORIES.intense,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        projectId: '',
        title: 'Variant C — More Believable',
        text: MOCK_STORIES.believable,
        createdAt: new Date().toISOString(),
      },
    ]
  },
}
