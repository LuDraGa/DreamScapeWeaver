import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

// ============================================================
// CONFIG DATA (would be JSON files in real Next.js project)
// ============================================================

const PRESETS = [
  {
    id: "reddit-aitah", name: "Reddit AITAH", subtitle: "High believability", emoji: "🔥",
    platform: "reddit", outputFormat: "reddit-post", wordCount: 800, tone: "narrative",
    intensity: { stakes: 7, darkness: 5, pace: 6, twist: 7, realism: 9, catharsis: 6, moralClarity: 4 },
  },
  {
    id: "petty-revenge", name: "Petty Revenge", subtitle: "Punchy short reel", emoji: "😈",
    platform: "reels", outputFormat: "reel-script", wordCount: 300, tone: "dialogue",
    intensity: { stakes: 4, darkness: 3, pace: 9, twist: 6, realism: 7, catharsis: 9, moralClarity: 7 },
  },
  {
    id: "psych-thriller", name: "Psych Thriller", subtitle: "Slow burn", emoji: "🧠",
    platform: "reddit", outputFormat: "short-story", wordCount: 1500, tone: "narrative",
    intensity: { stakes: 9, darkness: 8, pace: 3, twist: 9, realism: 6, catharsis: 5, moralClarity: 2 },
  },
  {
    id: "romance", name: "Romance", subtitle: "Warm dialogue", emoji: "💕",
    platform: "reddit", outputFormat: "short-story", wordCount: 1000, tone: "dialogue",
    intensity: { stakes: 5, darkness: 2, pace: 5, twist: 4, realism: 7, catharsis: 8, moralClarity: 6 },
  },
  {
    id: "pro-revenge", name: "Pro Revenge", subtitle: "Longer narrative", emoji: "⚡",
    platform: "reddit", outputFormat: "reddit-post", wordCount: 2000, tone: "narrative",
    intensity: { stakes: 8, darkness: 6, pace: 5, twist: 8, realism: 8, catharsis: 10, moralClarity: 8 },
  },
];

const PLATFORMS = [
  { id: "reddit", name: "Reddit", metrics: ["upvotes", "comments"] },
  { id: "reels", name: "Reels", metrics: ["views", "avgWatchTime", "shares"] },
  { id: "tiktok", name: "TikTok", metrics: ["views", "likes", "shares"] },
  { id: "blog", name: "Blog", metrics: ["views", "readTime"] },
];

const DIALS = {
  stakes: { label: "Stakes", min: 1, max: 10 },
  darkness: { label: "Darkness", min: 1, max: 10 },
  pace: { label: "Pace", min: 1, max: 10 },
  twist: { label: "Twist Factor", min: 1, max: 10 },
  realism: { label: "Realism", min: 1, max: 10 },
  catharsis: { label: "Catharsis", min: 1, max: 10 },
  moralClarity: { label: "Moral Clarity", min: 1, max: 10 },
};

const GENRES = ["Drama", "Comedy", "Thriller", "Horror", "Romance", "Satire", "Slice of Life", "Mystery", "Sci-Fi", "Fantasy"];
const OUTPUT_FORMATS = [
  { id: "reddit-post", name: "Reddit Post" }, { id: "reel-script", name: "Reel Script" },
  { id: "short-story", name: "Short Story" }, { id: "series", name: "Series (Multi-part)" },
];
const TONES = ["narrative", "dialogue", "script", "mixed"];

const ENHANCEMENT_GOALS = [
  { id: "vivid", label: "Add vividness", icon: "🎨" },
  { id: "conflict", label: "Add conflict", icon: "⚔️" },
  { id: "believable", label: "Make it more believable", icon: "🎯" },
  { id: "stitch", label: "Stitch chunks together", icon: "🧵" },
  { id: "less-ai", label: "Make it less AI-ish", icon: "🤖" },
];

const FEEDBACK_CHIPS = [
  { id: "hook-strong", label: "Hook strong", positive: true },
  { id: "hook-weak", label: "Hook weak", positive: false },
  { id: "natural", label: "Natural", positive: true },
  { id: "too-ai", label: "Too AI", positive: false },
  { id: "cohesion-strong", label: "Cohesion strong", positive: true },
  { id: "cohesion-weak", label: "Cohesion weak", positive: false },
  { id: "twist-good", label: "Twist unpredictable", positive: true },
  { id: "twist-predictable", label: "Twist predictable", positive: false },
  { id: "pace-good", label: "Pace good", positive: true },
  { id: "pace-fast", label: "Pace fast", positive: false },
  { id: "pace-slow", label: "Pace slow", positive: false },
];

// ============================================================
// MOCK API LAYER
// ============================================================

const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MOCK_DREAMSCAPE_SEEDS = [
  "A middle-aged accountant discovers their neighbor has been stealing their Wi-Fi for years — but the neighbor is a retired CIA operative who's been using it to monitor the HOA president.",
  "Two best friends accidentally RSVP 'yes' to the same exclusive dinner party, each claiming to be the other's plus-one. The host knows both of them.",
  "A barista starts leaving coded messages in latte art. Only one customer notices — and they're an off-duty detective going through a messy divorce.",
  "A woman finds her deceased grandmother's diary, revealing she had a secret penpal relationship with a famous author. The last letter contains a confession.",
  "Someone's smart home AI starts making passive-aggressive comments about their lifestyle choices. The twist: it might be the previous homeowner's ghost.",
  "A food critic with anosmia (no sense of smell) has been faking reviews for years. Their biggest fan is the chef they've been secretly rating highest.",
  "Two strangers keep getting each other's mail due to a postal error. They start communicating only through the margins of misdelivered letters.",
  "A therapist realizes their newest client is telling a story that exactly mirrors a novel the therapist wrote under a pseudonym — but never published.",
  "A dog walker discovers all their clients' dogs have been trained to respond to the same unusual whistle. The dogs belong to people who don't know each other.",
  "An Uber driver picks up the same passenger every Tuesday at 3am from a cemetery. The passenger always asks to be dropped at a children's hospital.",
];

const MOCK_STORIES = {
  balanced: `So this happened last week and I'm still processing it. I (34F) have been living next to "Greg" (60s M) for about six years. Nice enough guy, keeps to himself, waves when he's checking the mail. Normal neighbor stuff.

Anyway, I work from home and my internet has been garbage lately. I'm talking dropped Zoom calls during client presentations, buffering on everything. I called my ISP three times. They kept saying my signal was fine on their end.

My husband suggested I check how many devices were on our network. So I pulled up the router admin page and — twenty-seven devices. We own maybe eight.

I figured maybe it was a glitch, but then I saw device names. Things like "SIGINT-NODE-7" and "OVERWATCHTABLET." I am not making this up.

Long story short, I knocked on Greg's door. He opened it wearing reading glasses and a cardigan, looking like everyone's grandfather. I asked him point blank if he was using my WiFi. He didn't even flinch. Just said, "Come in, I'll make coffee. We should talk."

Turns out Greg is retired CIA. Not like, "I filed papers at Langley" retired. More like "I have a room in my basement with six monitors" retired. He's been using my network as a proxy because — and this is the part that broke my brain — he's been monitoring our HOA president, Sandra.

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
};

async function generateDreamscapes({ count, vibe }) {
  await sleep(1500 + Math.random() * 1000);
  const shuffled = [...MOCK_DREAMSCAPE_SEEDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((text) => ({
    id: uid(), title: "", chunks: [{ id: uid(), title: "", text }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
}

async function enhanceDreamscape({ chunks, goalPreset }) {
  await sleep(2000 + Math.random() * 500);
  const suffixes = {
    vivid: "\n\nThe fluorescent lights hummed overhead, casting everything in that sickly yellow-green tint that made even healthy skin look jaundiced. The coffee had gone cold hours ago, leaving a ring on the faux-wood desk.",
    conflict: "\n\nBut there's a catch — someone else knows. And they've been watching, waiting for the right moment to make their move.",
    believable: " (This actually happened to my coworker's sister, so I'm changing some details.)",
    stitch: "", "less-ai": "",
  };
  if (goalPreset === "stitch" && chunks.length > 1) {
    const combined = chunks.map((c) => c.text).join("\n\n---\n\n");
    return { stitchedSeed: `What started as two separate incidents ended up being connected in a way nobody expected.\n\n${combined}\n\nThe thing is — these aren't two stories. They're the same story from different angles.` };
  }
  return { enhancedChunks: chunks.map((c) => ({ ...c, id: uid(), text: c.text + (suffixes[goalPreset] || "") })) };
}

async function generateOutputs({ dreamscape, dialState }) {
  await sleep(2500 + Math.random() * 1000);
  return [
    { id: uid(), projectId: "", title: "Variant A — Balanced", text: MOCK_STORIES.balanced, createdAt: new Date().toISOString() },
    { id: uid(), projectId: "", title: "Variant B — More Intense", text: MOCK_STORIES.intense, createdAt: new Date().toISOString() },
    { id: uid(), projectId: "", title: "Variant C — More Believable", text: MOCK_STORIES.believable, createdAt: new Date().toISOString() },
  ];
}

// ============================================================
// LOCAL STORAGE
// ============================================================
function loadFromStorage(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ============================================================
// APP CONTEXT
// ============================================================
const AppContext = createContext(null);

function AppProvider({ children }) {
  const [savedDreamscapes, setSavedDreamscapes] = useState(() => loadFromStorage("sg_dreamscapes", []));
  const [savedOutputs, setSavedOutputs] = useState(() => loadFromStorage("sg_outputs", []));
  const [settings, setSettings] = useState(() => loadFromStorage("sg_settings", {
    defaultPreset: "reddit-aitah",
    avoidPhrases: ["It's worth noting that", "I couldn't help but", "Little did I know"],
    autoAvoidAI: true,
  }));

  useEffect(() => saveToStorage("sg_dreamscapes", savedDreamscapes), [savedDreamscapes]);
  useEffect(() => saveToStorage("sg_outputs", savedOutputs), [savedOutputs]);
  useEffect(() => saveToStorage("sg_settings", settings), [settings]);

  const saveDreamscape = (d) => setSavedDreamscapes((prev) => [d, ...prev.filter((x) => x.id !== d.id)]);
  const saveOutput = (o) => setSavedOutputs((prev) => [o, ...prev.filter((x) => x.id !== o.id)]);
  const deleteDreamscape = (id) => setSavedDreamscapes((prev) => prev.filter((x) => x.id !== id));
  const deleteOutput = (id) => setSavedOutputs((prev) => prev.filter((x) => x.id !== id));

  return (
    <AppContext.Provider value={{ savedDreamscapes, savedOutputs, settings, setSettings, saveDreamscape, saveOutput, deleteDreamscape, deleteOutput }}>
      {children}
    </AppContext.Provider>
  );
}
const useApp = () => useContext(AppContext);

// ============================================================
// ICONS
// ============================================================
const I = {
  Plus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Copy: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  ChevDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>,
  ChevUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>,
  ChevRight: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>,
  Sparkles: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></svg>,
  Wand: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5"/><path d="M2 22l10-10"/></svg>,
  Save: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
  Trash: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Grip: (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>,
  Pen: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Book: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  Gear: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Download: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  Refresh: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  Star: (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  StarO: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  Eye: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  ArrowUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  ArrowDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>,
  Reset: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
};

// ============================================================
// SHARED COMPONENTS
// ============================================================

function CopyBtn({ text, className = "" }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={handle} className={`inline-flex items-center gap-1.5 text-xs font-medium transition-all ${className}`}
      style={{ color: copied ? "#22c55e" : "#94a3b8" }}>
      {copied ? <I.Check className="w-3.5 h-3.5"/> : <I.Copy className="w-3.5 h-3.5"/>}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Toast({ message, show }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all duration-300"
      style={{
        background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155",
        transform: `translate(-50%, ${show ? "0" : "20px"})`, opacity: show ? 1 : 0, pointerEvents: show ? "auto" : "none",
      }}>
      {message}
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`rounded-lg ${className}`} style={{ background: "#1e293b", animation: "pulse 1.5s ease-in-out infinite" }}/>;
}

function Slider({ value, onChange, min = 1, max = 10, label }) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs font-medium w-24 shrink-0" style={{ color: "#94a3b8" }}>{label}</span>}
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer slider-track"
        style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((value - min) / (max - min)) * 100}%, #334155 ${((value - min) / (max - min)) * 100}%, #334155 100%)` }}/>
      <span className="text-xs font-mono w-6 text-right" style={{ color: "#e2e8f0" }}>{value}</span>
    </div>
  );
}

function Collapse({ open, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (ref.current) setHeight(ref.current.scrollHeight);
  }, [open, children]);
  return (
    <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? height + 20 : 0, opacity: open ? 1 : 0 }}>
      <div ref={ref}>{children}</div>
    </div>
  );
}

// ============================================================
// PAGE: CREATE
// ============================================================
function CreatePage({ loadDreamscape, loadOutput }) {
  const { saveDreamscape, saveOutput, settings } = useApp();
  const [step, setStep] = useState(0);
  const [chunks, setChunks] = useState([{ id: uid(), title: "", text: "" }]);
  const [selectedPreset, setSelectedPreset] = useState(settings.defaultPreset || "reddit-aitah");
  const [outputs, setOutputs] = useState([]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [showEnhance, setShowEnhance] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [genCount, setGenCount] = useState(3);
  const [genVibe, setGenVibe] = useState("");
  const [genResults, setGenResults] = useState([]);
  const [genLoading, setGenLoading] = useState(false);
  const [enhanceGoal, setEnhanceGoal] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState(null);
  const [ratings, setRatings] = useState({});
  const [feedback, setFeedback] = useState({});
  const [notes, setNotes] = useState({});
  const [toast, setToast] = useState("");
  const [dialState, setDialState] = useState(() => {
    const p = PRESETS.find((x) => x.id === (settings.defaultPreset || "reddit-aitah")) || PRESETS[0];
    return {
      presetId: p.id, platform: p.platform, outputFormat: p.outputFormat,
      wordCount: p.wordCount, tone: p.tone, intensity: { ...p.intensity },
      genrePrimary: "", genreSecondary: "", avoidPhrases: [...(settings.avoidPhrases || [])],
      cohesionStrictness: 5,
    };
  });

  useEffect(() => { if (loadDreamscape) { setChunks(loadDreamscape.chunks?.length > 0 ? loadDreamscape.chunks : [{ id: uid(), title: "", text: "" }]); setStep(0); } }, [loadDreamscape]);
  useEffect(() => { if (loadOutput) { setOutputs([loadOutput]); setActiveVariant(0); setStep(3); } }, [loadOutput]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };
  const updateChunk = (id, field, val) => setChunks((p) => p.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  const removeChunk = (id) => setChunks((p) => (p.length === 1 ? p : p.filter((c) => c.id !== id)));
  const addChunk = () => setChunks((p) => [...p, { id: uid(), title: "", text: "" }]);
  const moveChunk = (idx, dir) => { setChunks((p) => { const a = [...p]; const n = idx + dir; if (n < 0 || n >= a.length) return a; [a[idx], a[n]] = [a[n], a[idx]]; return a; }); };

  const handleSelectPreset = (pid) => {
    setSelectedPreset(pid);
    const p = PRESETS.find((x) => x.id === pid);
    if (p) setDialState((s) => ({ ...s, presetId: p.id, platform: p.platform, outputFormat: p.outputFormat, wordCount: p.wordCount, tone: p.tone, intensity: { ...p.intensity } }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const ds = { id: uid(), chunks, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const r = await generateOutputs({ dreamscape: ds, dialState });
      setOutputs(r); setActiveVariant(0); setStep(3);
    } finally { setGenerating(false); }
  };

  const handleRegenVariant = async (idx) => {
    setGenerating(true);
    try {
      const ds = { id: uid(), chunks, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const r = await generateOutputs({ dreamscape: ds, dialState });
      setOutputs((p) => p.map((o, i) => (i === idx ? r[idx] || r[0] : o)));
    } finally { setGenerating(false); }
  };

  const handleGenDreamscapes = async () => {
    setGenLoading(true);
    try { const r = await generateDreamscapes({ count: genCount, vibe: genVibe }); setGenResults(r); } finally { setGenLoading(false); }
  };

  const handleEnhance = async () => {
    if (!enhanceGoal) return;
    setEnhancing(true);
    try { const r = await enhanceDreamscape({ chunks, goalPreset: enhanceGoal }); setEnhanceResult(r); } finally { setEnhancing(false); }
  };

  const applyEnhancement = () => {
    if (enhanceResult?.enhancedChunks) setChunks(enhanceResult.enhancedChunks);
    else if (enhanceResult?.stitchedSeed) setChunks([{ id: uid(), title: "Stitched", text: enhanceResult.stitchedSeed }]);
    setEnhanceResult(null); setShowEnhance(false); showToast("Enhancement applied");
  };

  const handleSaveOutput = (variant, idx) => {
    saveOutput({ ...variant, rating: ratings[idx], feedbackTags: feedback[idx] || [], note: notes[idx] || "", performanceSnapshots: [] });
    showToast("Saved to library");
  };

  const handleSaveDreamscape = () => {
    saveDreamscape({ id: uid(), title: chunks[0]?.title || "Untitled", chunks, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    showToast("Dreamscape saved");
  };

  const handleStartOver = () => { setChunks([{ id: uid(), title: "", text: "" }]); setOutputs([]); setStep(0); setRatings({}); setFeedback({}); setNotes({}); setShowAdvanced(false); };

  const handleExport = (text) => {
    const b = new Blob([text], { type: "text/plain" }); const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u; a.download = "story-output.txt"; a.click(); URL.revokeObjectURL(u);
  };

  const steps = [{ label: "Dreamscape", s: "A" }, { label: "Preset", s: "B" }, { label: "Generate", s: "C" }, { label: "Rate & Save", s: "D" }];
  const canProceed = chunks.some((c) => c.text.trim().length > 10);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shrink-0"
            style={{ background: step === i ? "#6366f1" : step > i ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.5)", color: step === i ? "#fff" : step > i ? "#a5b4fc" : "#64748b", border: step === i ? "1px solid #818cf8" : "1px solid transparent" }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: step >= i ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)" }}>
              {step > i ? "✓" : s.s}
            </span>
            {s.label}
          </button>
        ))}
        <div className="flex-1"/>
        <button onClick={handleStartOver} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ color: "#94a3b8", border: "1px solid #334155" }}>
          <I.Reset className="w-3.5 h-3.5"/> Start Over
        </button>
      </div>

      {/* STEP A: Dreamscape */}
      <div style={{ display: step === 0 ? "block" : "none" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>Dreamscape</h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Describe your story seed. Add multiple chunks for disjoint scenes.</p>
          </div>
          <div className="flex items-center gap-2">
            {chunks.length > 1 && (
              <button onClick={() => setShowMerge(!showMerge)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: showMerge ? "rgba(99,102,241,0.2)" : "rgba(30,41,59,0.6)", color: showMerge ? "#a5b4fc" : "#94a3b8", border: "1px solid #334155" }}>
                <I.Eye className="w-3.5 h-3.5"/> Merge View
              </button>
            )}
            <button onClick={() => setShowGenPanel(!showGenPanel)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
              <I.Sparkles className="w-3.5 h-3.5"/> Generate Ideas
            </button>
            <button onClick={() => setShowEnhance(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
              <I.Wand className="w-3.5 h-3.5"/> Enhance
            </button>
          </div>
        </div>

        {/* Generate Ideas Panel */}
        <Collapse open={showGenPanel}>
          <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="flex items-end gap-3 mb-3 flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Vibe (optional)</label>
                <input value={genVibe} onChange={(e) => setGenVibe(e.target.value)} placeholder="e.g. dark comedy, workplace drama..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "rgba(15,23,42,0.6)", color: "#e2e8f0", border: "1px solid #334155" }}/>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Count</label>
                <select value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg text-sm outline-none appearance-none" style={{ background: "rgba(15,23,42,0.6)", color: "#e2e8f0", border: "1px solid #334155" }}>
                  {[1,2,3,5,10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button onClick={handleGenDreamscapes} disabled={genLoading} className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: "#6366f1", color: "#fff", opacity: genLoading ? 0.6 : 1 }}>
                {genLoading ? "Generating..." : "Generate"}
              </button>
            </div>
            {genLoading && <div className="grid gap-2">{Array.from({ length: genCount }).map((_, i) => <Skeleton key={i} className="h-20 w-full"/>)}</div>}
            {genResults.length > 0 && !genLoading && (
              <div className="grid gap-2 max-h-72 overflow-y-auto">
                {genResults.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg flex gap-3 group" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid #1e293b" }}>
                    <p className="text-sm flex-1" style={{ color: "#cbd5e1" }}>{d.chunks[0]?.text}</p>
                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => {
                        setChunks((prev) => { const f = prev[0]; if (!f.text.trim()) return [{ ...f, text: d.chunks[0].text }]; return [...prev, { id: uid(), title: "", text: d.chunks[0].text }]; });
                        setGenResults((prev) => prev.filter((x) => x.id !== d.id)); showToast("Added to chunks");
                      }} className="px-2 py-1 rounded text-xs font-medium" style={{ background: "#6366f1", color: "#fff" }}>Use</button>
                      <button onClick={() => setGenResults((prev) => prev.filter((x) => x.id !== d.id))} className="px-2 py-1 rounded text-xs" style={{ color: "#64748b" }}>Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Collapse>

        {/* Merge View */}
        <Collapse open={showMerge && chunks.length > 1}>
          <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Combined Preview (read-only)</span>
              <CopyBtn text={chunks.map((c) => c.text).join("\n\n---\n\n")}/>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#cbd5e1" }}>{chunks.map((c) => c.text).join("\n\n---\n\n")}</p>
          </div>
        </Collapse>

        {/* Chunks */}
        <div className="space-y-3">
          {chunks.map((chunk, idx) => (
            <div key={chunk.id} className="rounded-xl p-4 group transition-all" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
              <div className="flex items-center gap-2 mb-2">
                <I.Grip className="w-4 h-4 shrink-0 cursor-grab" style={{ color: "#475569" }}/>
                <input value={chunk.title} onChange={(e) => updateChunk(chunk.id, "title", e.target.value)}
                  placeholder={`Chunk ${idx + 1} title (optional)`} className="flex-1 bg-transparent text-sm font-medium outline-none" style={{ color: "#e2e8f0" }}/>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && <button onClick={() => moveChunk(idx, -1)} className="p-1 rounded" style={{ color: "#64748b" }}><I.ArrowUp className="w-3.5 h-3.5"/></button>}
                  {idx < chunks.length - 1 && <button onClick={() => moveChunk(idx, 1)} className="p-1 rounded" style={{ color: "#64748b" }}><I.ArrowDown className="w-3.5 h-3.5"/></button>}
                  {chunks.length > 1 && <button onClick={() => removeChunk(chunk.id)} className="p-1 rounded" style={{ color: "#ef4444" }}><I.Trash className="w-3.5 h-3.5"/></button>}
                </div>
              </div>
              <textarea value={chunk.text} onChange={(e) => updateChunk(chunk.id, "text", e.target.value)}
                placeholder={idx === 0 ? "Describe a scene, character, setting, situation... anything goes." : "Add another scene or element to weave in."} rows={4}
                className="w-full bg-transparent text-sm outline-none resize-none" style={{ color: "#cbd5e1" }}/>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button onClick={addChunk} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ color: "#94a3b8", border: "1px dashed #334155" }}><I.Plus className="w-3.5 h-3.5"/> Add chunk</button>
          <button onClick={handleSaveDreamscape} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ color: "#94a3b8", border: "1px solid #334155" }}><I.Save className="w-3.5 h-3.5"/> Save dreamscape</button>
          <div className="flex-1"/>
          <button onClick={() => setStep(1)} disabled={!canProceed} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: canProceed ? "#6366f1" : "#1e293b", color: canProceed ? "#fff" : "#475569" }}>Choose Preset →</button>
        </div>

        {/* Enhance Drawer Overlay */}
        {showEnhance && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowEnhance(false)}>
            <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.5)" }}/>
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md h-full overflow-y-auto p-6"
              style={{ background: "#0f172a", borderLeft: "1px solid #1e293b", animation: "slideInRight 0.3s ease" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold" style={{ color: "#f1f5f9" }}>Enhance Dreamscape</h3>
                <button onClick={() => setShowEnhance(false)} style={{ color: "#64748b" }}><I.X className="w-5 h-5"/></button>
              </div>
              <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Pick an enhancement goal:</p>
              <div className="grid gap-2 mb-6">
                {ENHANCEMENT_GOALS.map((g) => (
                  <button key={g.id} onClick={() => setEnhanceGoal(g.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                    style={{ background: enhanceGoal === g.id ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.5)", color: enhanceGoal === g.id ? "#a5b4fc" : "#cbd5e1", border: enhanceGoal === g.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid #1e293b" }}>
                    <span className="text-lg">{g.icon}</span> {g.label}
                  </button>
                ))}
              </div>
              <button onClick={handleEnhance} disabled={!enhanceGoal || enhancing} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: enhanceGoal ? "#6366f1" : "#1e293b", color: enhanceGoal ? "#fff" : "#475569" }}>
                {enhancing ? "Enhancing..." : "Apply Enhancement"}
              </button>
              {enhancing && <div className="mt-4"><Skeleton className="h-32 w-full"/></div>}
              {enhanceResult && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <span className="text-xs font-medium mb-1 block" style={{ color: "#22c55e" }}>Enhanced Preview</span>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "#cbd5e1" }}>{enhanceResult.stitchedSeed || enhanceResult.enhancedChunks?.map((c) => c.text).join("\n\n---\n\n")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={applyEnhancement} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: "#22c55e", color: "#fff" }}>Accept</button>
                    <button onClick={() => setEnhanceResult(null)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: "#1e293b", color: "#94a3b8" }}>Reject</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP B: Presets */}
      <div style={{ display: step === 1 ? "block" : "none" }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#f1f5f9" }}>Choose a Preset</h2>
        <p className="text-sm mb-5" style={{ color: "#64748b" }}>Sets the vibe for your story. Tweak details in Advanced.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => handleSelectPreset(p.id)} className="p-4 rounded-xl text-left transition-all duration-200"
              style={{ background: selectedPreset === p.id ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.5)", border: selectedPreset === p.id ? "2px solid #6366f1" : "2px solid #1e293b" }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{p.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{p.subtitle}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>{p.platform}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>~{p.wordCount}w</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{p.tone}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Advanced */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e293b" }}>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
            style={{ background: "rgba(15,23,42,0.5)", color: "#94a3b8" }}>
            <span>Advanced Options</span>
            {showAdvanced ? <I.ChevUp className="w-4 h-4"/> : <I.ChevDown className="w-4 h-4"/>}
          </button>
          <Collapse open={showAdvanced}>
            <div className="p-4 space-y-5" style={{ background: "rgba(15,23,42,0.3)" }}>
              <Slider label="Word Count" value={dialState.wordCount} onChange={(v) => setDialState((s) => ({ ...s, wordCount: v }))} min={100} max={5000}/>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#94a3b8" }}>Platform</label>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map((pl) => (
                    <button key={pl.id} onClick={() => setDialState((s) => ({ ...s, platform: pl.id }))} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: dialState.platform === pl.id ? "rgba(99,102,241,0.2)" : "rgba(30,41,59,0.5)", color: dialState.platform === pl.id ? "#a5b4fc" : "#94a3b8", border: dialState.platform === pl.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid #334155" }}>{pl.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#94a3b8" }}>Output Format</label>
                <div className="flex gap-2 flex-wrap">
                  {OUTPUT_FORMATS.map((f) => (
                    <button key={f.id} onClick={() => setDialState((s) => ({ ...s, outputFormat: f.id }))} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: dialState.outputFormat === f.id ? "rgba(99,102,241,0.2)" : "rgba(30,41,59,0.5)", color: dialState.outputFormat === f.id ? "#a5b4fc" : "#94a3b8", border: dialState.outputFormat === f.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid #334155" }}>{f.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#94a3b8" }}>Tone</label>
                <div className="flex gap-2 flex-wrap">
                  {TONES.map((t) => (
                    <button key={t} onClick={() => setDialState((s) => ({ ...s, tone: t }))} className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                      style={{ background: dialState.tone === t ? "rgba(99,102,241,0.2)" : "rgba(30,41,59,0.5)", color: dialState.tone === t ? "#a5b4fc" : "#94a3b8", border: dialState.tone === t ? "1px solid rgba(99,102,241,0.3)" : "1px solid #334155" }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#94a3b8" }}>Genre (optional)</label>
                <div className="flex gap-2 flex-wrap">
                  {GENRES.map((g) => (
                    <button key={g} onClick={() => setDialState((s) => ({ ...s, genrePrimary: s.genrePrimary === g ? "" : g }))} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: dialState.genrePrimary === g ? "rgba(99,102,241,0.2)" : "rgba(30,41,59,0.5)", color: dialState.genrePrimary === g ? "#a5b4fc" : "#94a3b8", border: dialState.genrePrimary === g ? "1px solid rgba(99,102,241,0.3)" : "1px solid #334155" }}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-3 block" style={{ color: "#94a3b8" }}>Intensity Dials</label>
                <div className="space-y-2">
                  {Object.entries(DIALS).map(([key, dial]) => (
                    <Slider key={key} label={dial.label} value={dialState.intensity?.[key] || 5}
                      onChange={(v) => setDialState((s) => ({ ...s, intensity: { ...s.intensity, [key]: v } }))} min={dial.min} max={dial.max}/>
                  ))}
                </div>
              </div>
              <Slider label="Cohesion" value={dialState.cohesionStrictness || 5} onChange={(v) => setDialState((s) => ({ ...s, cohesionStrictness: v }))} min={1} max={10}/>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#94a3b8" }}>Avoid Phrases</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dialState.avoidPhrases.map((phrase, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {phrase}
                      <button onClick={() => setDialState((s) => ({ ...s, avoidPhrases: s.avoidPhrases.filter((_, j) => j !== i) }))} className="ml-0.5"><I.X className="w-3 h-3"/></button>
                    </span>
                  ))}
                </div>
                <input placeholder="Type phrase and press Enter" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(15,23,42,0.6)", color: "#e2e8f0", border: "1px solid #334155" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) { setDialState((s) => ({ ...s, avoidPhrases: [...s.avoidPhrases, e.target.value.trim()] })); e.target.value = ""; } }}/>
              </div>
              <button onClick={() => { const p = PRESETS.find((x) => x.id === selectedPreset); if (p) setDialState((s) => ({ ...s, intensity: Object.fromEntries(Object.entries(p.intensity).map(([k, v]) => [k, Math.max(1, Math.min(10, v + Math.floor(Math.random() * 5) - 2))])) })); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all" style={{ background: "rgba(30,41,59,0.6)", color: "#94a3b8", border: "1px solid #334155" }}>
                🎲 Randomize within preset
              </button>
            </div>
          </Collapse>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(0)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ color: "#94a3b8" }}>← Back</button>
          <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#6366f1", color: "#fff" }}>Generate →</button>
        </div>
      </div>

      {/* STEP C: Generate */}
      <div style={{ display: step === 2 ? "block" : "none" }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#f1f5f9" }}>Generate Story</h2>
        <p className="text-sm mb-5" style={{ color: "#64748b" }}>
          Using <strong style={{ color: "#a5b4fc" }}>{PRESETS.find((p) => p.id === selectedPreset)?.name}</strong> preset • {chunks.length} chunk{chunks.length > 1 ? "s" : ""} • ~{dialState.wordCount} words
        </p>
        <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
          <div className="text-xs font-medium mb-2" style={{ color: "#64748b" }}>Dreamscape Preview</div>
          <p className="text-sm" style={{ color: "#cbd5e1", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{chunks.map((c) => c.text).join(" | ")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ color: "#94a3b8" }}>← Back</button>
          <button onClick={handleGenerate} disabled={generating} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{ background: generating ? "#4338ca" : "#6366f1", color: "#fff" }}>
            {generating ? <><I.Refresh className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }}/> Generating 3 variants...</> : <><I.Sparkles className="w-4 h-4"/> Generate 3 Variants</>}
          </button>
        </div>
        {generating && <div className="mt-6 space-y-3">{[0,1,2].map((i) => <Skeleton key={i} className="h-32 w-full"/>)}</div>}
      </div>

      {/* STEP D: Rate + Save */}
      <div style={{ display: step === 3 && outputs.length > 0 ? "block" : "none" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>Your Variants</h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Rate, refine, and save.</p>
          </div>
          <button onClick={() => { setStep(2); setOutputs([]); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: "#94a3b8", border: "1px solid #334155" }}><I.Refresh className="w-3.5 h-3.5"/> Generate More</button>
        </div>

        {/* Variant Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "rgba(15,23,42,0.5)" }}>
          {outputs.map((o, i) => (
            <button key={o.id} onClick={() => setActiveVariant(i)} className="flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: activeVariant === i ? "#6366f1" : "transparent", color: activeVariant === i ? "#fff" : "#94a3b8" }}>
              {o.title || `Variant ${String.fromCharCode(65 + i)}`}
            </button>
          ))}
        </div>

        {/* Variant Content */}
        <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium" style={{ color: "#64748b" }}>{outputs[activeVariant]?.text?.split(/\s+/).length || 0} words</span>
            <div className="flex items-center gap-2">
              <CopyBtn text={outputs[activeVariant]?.text || ""}/>
              <button onClick={() => handleRegenVariant(activeVariant)} disabled={generating} className="flex items-center gap-1 text-xs font-medium transition-all" style={{ color: "#94a3b8" }}>
                <I.Refresh className="w-3.5 h-3.5"/> Regen
              </button>
            </div>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2" style={{ color: "#e2e8f0" }}>
            {outputs[activeVariant]?.text}
          </div>
        </div>

        {/* Rating */}
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(15,23,42,0.3)", border: "1px solid #1e293b" }}>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Rating</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <button key={i} onClick={() => setRatings((prev) => ({ ...prev, [activeVariant]: i + 1 }))} className="p-0.5 transition-all">
                  {i < (ratings[activeVariant] || 0) ? <I.Star className="w-5 h-5" style={{ color: "#eab308" }}/> : <I.StarO className="w-5 h-5" style={{ color: "#334155" }}/>}
                </button>
              ))}
            </div>
            {ratings[activeVariant] && <span className="text-xs font-mono" style={{ color: "#eab308" }}>{ratings[activeVariant]}/10</span>}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FEEDBACK_CHIPS.map((chip) => {
              const isA = (feedback[activeVariant] || []).includes(chip.id);
              return (
                <button key={chip.id} onClick={() => setFeedback((prev) => { const c = prev[activeVariant] || []; return { ...prev, [activeVariant]: isA ? c.filter((x) => x !== chip.id) : [...c, chip.id] }; })}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{ background: isA ? (chip.positive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)") : "rgba(30,41,59,0.5)", color: isA ? (chip.positive ? "#4ade80" : "#f87171") : "#64748b", border: isA ? (chip.positive ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)") : "1px solid #334155" }}>
                  {chip.label}
                </button>
              );
            })}
          </div>
          <input value={notes[activeVariant] || ""} onChange={(e) => setNotes((prev) => ({ ...prev, [activeVariant]: e.target.value }))}
            placeholder="Add a note (optional)" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "rgba(15,23,42,0.6)", color: "#e2e8f0", border: "1px solid #334155" }}/>
        </div>

        {/* Save Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleSaveOutput(outputs[activeVariant], activeVariant)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#6366f1", color: "#fff" }}><I.Save className="w-4 h-4"/> Save to Library</button>
          <button onClick={() => { setChunks([{ id: uid(), title: "", text: outputs[activeVariant]?.text || "" }]); setOutputs([]); setStep(0); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(30,41,59,0.6)", color: "#94a3b8", border: "1px solid #334155" }}>Duplicate as new project</button>
          <button onClick={() => handleExport(outputs[activeVariant]?.text || "")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "rgba(30,41,59,0.6)", color: "#94a3b8", border: "1px solid #334155" }}><I.Download className="w-4 h-4"/> Export .txt</button>
        </div>
      </div>

      <Toast message={toast} show={!!toast}/>
    </div>
  );
}

// ============================================================
// PAGE: LIBRARY
// ============================================================
function LibraryPage({ onOpenDreamscape, onOpenOutput }) {
  const { savedDreamscapes, savedOutputs, deleteDreamscape, deleteOutput, saveOutput } = useApp();
  const [tab, setTab] = useState("dreamscapes");
  const [search, setSearch] = useState("");
  const [expandedOutput, setExpandedOutput] = useState(null);
  const [showPerfForm, setShowPerfForm] = useState(null);
  const [perfCadence, setPerfCadence] = useState("week");
  const [perfMetrics, setPerfMetrics] = useState({});
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const filteredD = savedDreamscapes.filter((d) => !search || d.chunks?.some((c) => c.text.toLowerCase().includes(search.toLowerCase())));
  const filteredO = savedOutputs.filter((o) => !search || o.text?.toLowerCase().includes(search.toLowerCase()) || o.title?.toLowerCase().includes(search.toLowerCase()));

  const handleAddPerf = (output) => {
    const snap = { id: uid(), variantId: output.id, cadence: perfCadence, platform: "reddit", metrics: { ...perfMetrics }, recordedAt: new Date().toISOString() };
    saveOutput({ ...output, performanceSnapshots: [...(output.performanceSnapshots || []), snap] });
    setShowPerfForm(null); setPerfMetrics({}); showToast("Snapshot added");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-1" style={{ color: "#f1f5f9" }}>Library</h1>
      <p className="text-sm mb-5" style={{ color: "#64748b" }}>Your saved dreamscapes and outputs.</p>

      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(15,23,42,0.5)" }}>
          {["dreamscapes", "outputs"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all"
              style={{ background: tab === t ? "#6366f1" : "transparent", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t} ({t === "dreamscapes" ? savedDreamscapes.length : savedOutputs.length})
            </button>
          ))}
        </div>
        <div className="flex-1 relative min-w-48">
          <I.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#475569" }}/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none" style={{ background: "rgba(15,23,42,0.5)", color: "#e2e8f0", border: "1px solid #1e293b" }}/>
        </div>
      </div>

      {/* Dreamscapes */}
      {tab === "dreamscapes" && (
        filteredD.length === 0 ? (
          <div className="py-16 text-center"><p className="text-sm" style={{ color: "#475569" }}>No saved dreamscapes yet. Create one in the workspace.</p></div>
        ) : (
          <div className="space-y-2">
            {filteredD.map((d) => (
              <div key={d.id} className="p-4 rounded-xl group flex gap-4" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>{d.title || d.chunks?.[0]?.text?.slice(0, 60) || "Untitled"}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px]" style={{ color: "#64748b" }}>{d.chunks?.length || 0} chunks</span>
                    <span className="text-[10px]" style={{ color: "#475569" }}>•</span>
                    <span className="text-[10px]" style={{ color: "#64748b" }}>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#64748b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{d.chunks?.[0]?.text}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => onOpenDreamscape(d)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#6366f1", color: "#fff" }}>Open</button>
                  <button onClick={() => deleteDreamscape(d.id)} className="p-1.5 rounded-lg" style={{ color: "#ef4444" }}><I.Trash className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Outputs */}
      {tab === "outputs" && (
        filteredO.length === 0 ? (
          <div className="py-16 text-center"><p className="text-sm" style={{ color: "#475569" }}>No saved outputs yet. Generate some stories first.</p></div>
        ) : (
          <div className="space-y-2">
            {filteredO.map((o) => (
              <div key={o.id}>
                <div className="p-4 rounded-xl group cursor-pointer" onClick={() => setExpandedOutput(expandedOutput === o.id ? null : o.id)}
                  style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>{o.title || "Untitled Output"}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {o.rating && <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}>★ {o.rating}/10</span>}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{o.text?.split(/\s+/).length || 0}w</span>
                        <span className="text-[10px]" style={{ color: "#64748b" }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CopyBtn text={o.text || ""}/>
                      <button onClick={(e) => { e.stopPropagation(); onOpenOutput(o); }} className="px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#6366f1", color: "#fff" }}>Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteOutput(o.id); }} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#ef4444" }}><I.Trash className="w-3.5 h-3.5"/></button>
                      <I.ChevDown className={`w-4 h-4 transition-transform duration-200 ${expandedOutput === o.id ? "rotate-180" : ""}`} style={{ color: "#475569" }}/>
                    </div>
                  </div>
                </div>
                <Collapse open={expandedOutput === o.id}>
                  <div className="p-4 rounded-b-xl -mt-1 space-y-3" style={{ background: "rgba(15,23,42,0.3)", borderBottom: "1px solid #1e293b", borderLeft: "1px solid #1e293b", borderRight: "1px solid #1e293b" }}>
                    <div className="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto pr-2" style={{ color: "#cbd5e1" }}>{o.text}</div>
                    {o.feedbackTags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {o.feedbackTags.map((tag) => {
                          const chip = FEEDBACK_CHIPS.find((c) => c.id === tag);
                          return <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: chip?.positive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: chip?.positive ? "#4ade80" : "#f87171" }}>{chip?.label || tag}</span>;
                        })}
                      </div>
                    )}
                    {o.note && <p className="text-xs italic" style={{ color: "#64748b" }}>"{o.note}"</p>}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Performance</span>
                        <button onClick={() => setShowPerfForm(showPerfForm === o.id ? null : o.id)} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#6366f1" }}><I.Plus className="w-3 h-3"/> Add snapshot</button>
                      </div>
                      {(o.performanceSnapshots || []).length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {o.performanceSnapshots.map((snap) => (
                            <div key={snap.id} className="shrink-0 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155" }}>
                              <div className="font-medium mb-1" style={{ color: "#94a3b8" }}>{snap.cadence} • {new Date(snap.recordedAt).toLocaleDateString()}</div>
                              {Object.entries(snap.metrics).filter(([,v]) => v).map(([k, v]) => <div key={k} style={{ color: "#64748b" }}>{k}: {v}</div>)}
                            </div>
                          ))}
                        </div>
                      )}
                      <Collapse open={showPerfForm === o.id}>
                        <div className="mt-2 p-3 rounded-lg space-y-2" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #334155" }}>
                          <div className="flex gap-2">
                            {["day","week","month"].map((c) => (
                              <button key={c} onClick={() => setPerfCadence(c)} className="px-2 py-1 rounded text-xs font-medium capitalize"
                                style={{ background: perfCadence === c ? "rgba(99,102,241,0.2)" : "transparent", color: perfCadence === c ? "#a5b4fc" : "#64748b" }}>{c}</button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {["upvotes","comments","views","shares"].map((m) => (
                              <div key={m}>
                                <label className="text-[10px] capitalize" style={{ color: "#64748b" }}>{m}</label>
                                <input type="number" value={perfMetrics[m] || ""} onChange={(e) => setPerfMetrics((p) => ({ ...p, [m]: Number(e.target.value) }))}
                                  className="w-full px-2 py-1 rounded text-xs outline-none" style={{ background: "rgba(15,23,42,0.6)", color: "#e2e8f0", border: "1px solid #334155" }}/>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => handleAddPerf(o)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#6366f1", color: "#fff" }}>Save Snapshot</button>
                        </div>
                      </Collapse>
                    </div>
                  </div>
                </Collapse>
              </div>
            ))}
          </div>
        )
      )}
      <Toast message={toast} show={!!toast}/>
    </div>
  );
}

// ============================================================
// PAGE: SETTINGS
// ============================================================
function SettingsPage() {
  const { settings, setSettings } = useApp();
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-1" style={{ color: "#f1f5f9" }}>Settings</h1>
      <p className="text-sm mb-6" style={{ color: "#64748b" }}>Configure defaults for your workspace.</p>
      <div className="space-y-6">
        <div className="p-5 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
          <label className="text-sm font-medium mb-3 block" style={{ color: "#e2e8f0" }}>Default Preset</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => setSettings((s) => ({ ...s, defaultPreset: p.id }))} className="p-3 rounded-lg text-left text-xs font-medium transition-all"
                style={{ background: settings.defaultPreset === p.id ? "rgba(99,102,241,0.15)" : "rgba(30,41,59,0.5)", color: settings.defaultPreset === p.id ? "#a5b4fc" : "#94a3b8", border: settings.defaultPreset === p.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid #334155" }}>
                <span className="mr-1">{p.emoji}</span> {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
          <label className="text-sm font-medium mb-3 block" style={{ color: "#e2e8f0" }}>Default Avoid Phrases</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {settings.avoidPhrases.map((phrase, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                {phrase}
                <button onClick={() => setSettings((s) => ({ ...s, avoidPhrases: s.avoidPhrases.filter((_, j) => j !== i) }))} className="ml-0.5"><I.X className="w-3 h-3"/></button>
              </span>
            ))}
          </div>
          <input placeholder="Type phrase and press Enter" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "rgba(15,23,42,0.6)", color: "#e2e8f0", border: "1px solid #334155" }}
            onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) { setSettings((s) => ({ ...s, avoidPhrases: [...s.avoidPhrases, e.target.value.trim()] })); e.target.value = ""; } }}/>
        </div>
        <div className="p-5 rounded-xl flex items-center justify-between" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b" }}>
          <div>
            <div className="text-sm font-medium" style={{ color: "#e2e8f0" }}>Auto-avoid common AI phrases</div>
            <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>Automatically filter out typical AI-generated phrasing</div>
          </div>
          <button onClick={() => setSettings((s) => ({ ...s, autoAvoidAI: !s.autoAvoidAI }))} className="w-11 h-6 rounded-full relative transition-all duration-200"
            style={{ background: settings.autoAvoidAI ? "#6366f1" : "#334155" }}>
            <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-200" style={{ left: settings.autoAvoidAI ? 22 : 2, background: "#fff" }}/>
          </button>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>Reset All Local Data</button>
      </div>
      <Toast message={toast} show={!!toast}/>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function StoryGeneratorApp() {
  const [page, setPage] = useState("create");
  const [loadDreamscape, setLoadDreamscape] = useState(null);
  const [loadOutput, setLoadOutput] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleOpenDreamscape = (d) => { setLoadDreamscape({ ...d, _t: Date.now() }); setPage("create"); };
  const handleOpenOutput = (o) => { setLoadOutput({ ...o, _t: Date.now() }); setPage("create"); };

  const navItems = [
    { id: "create", label: "Create", icon: I.Pen },
    { id: "library", label: "Library", icon: I.Book },
    { id: "settings", label: "Settings", icon: I.Gear },
  ];

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "#080c14", fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <style>{`
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 999px; }
          ::-webkit-scrollbar-thumb:hover { background: #334155; }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 14px; height: 14px; border-radius: 999px;
            background: #6366f1; cursor: pointer; border: 2px solid #818cf8;
          }
          @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>

        {/* Sidebar */}
        <nav className="h-full flex flex-col py-4 shrink-0 transition-all duration-300"
          style={{ width: sidebarCollapsed ? 64 : 200, background: "rgba(15,23,42,0.4)", borderRight: "1px solid #1e293b" }}>
          <div className={`flex items-center gap-2.5 px-4 mb-8 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <I.Sparkles className="w-4 h-4" style={{ color: "#fff" }}/>
            </div>
            {!sidebarCollapsed && <span className="text-sm font-bold tracking-tight" style={{ color: "#f1f5f9" }}>StoryForge</span>}
          </div>
          <div className="flex-1 space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon; const active = page === item.id;
              return (
                <button key={item.id} onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${sidebarCollapsed ? "justify-center" : ""}`}
                  style={{ background: active ? "rgba(99,102,241,0.12)" : "transparent", color: active ? "#a5b4fc" : "#64748b" }}>
                  <Icon className="w-[18px] h-[18px] shrink-0"/>{!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
          <div className="px-2">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${sidebarCollapsed ? "justify-center" : ""}`} style={{ color: "#475569" }}>
              <I.ChevRight className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? "" : "rotate-180"}`}/>{!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {page === "create" && <CreatePage loadDreamscape={loadDreamscape} loadOutput={loadOutput}/>}
          {page === "library" && <LibraryPage onOpenDreamscape={handleOpenDreamscape} onOpenOutput={handleOpenOutput}/>}
          {page === "settings" && <SettingsPage/>}
        </main>
      </div>
    </AppProvider>
  );
}
