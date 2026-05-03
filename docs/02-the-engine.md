# 02 — The Engine

The engine is what actually does the work. It takes input from the customer (in one of three modes), runs it through a structured pipeline of agents, and produces platform-ready content pieces.

This document covers each mode end-to-end — what the customer sees, what happens behind the curtain, what comes out the other side.

---

## The three input modes

### Repurpose mode

Customer pastes a long-form input. Engine fragments it into platform-native pieces.

**Input examples:**
- A 1,500-word newsletter
- A podcast transcript
- A YouTube video transcript
- A blog post URL (engine fetches and parses)
- A long email or memo

**What the customer does:**
1. Goes to `/app/create/repurpose`
2. Pastes text or drops a URL
3. Optionally selects target platforms (default: all connected)
4. Optionally selects which formats they want (default: a sensible spread)
5. Clicks Generate

**What comes out:**
A structured set of pieces, typically:
- 1× X (Twitter) thread (8–10 tweets)
- 3–5× X long tweets / single posts
- 3–5× LinkedIn posts (each on a single insight)
- 1× Threads post or set
- 1× IG carousel storyboard (Phase 4+)

Each piece is independently visible, editable, copy-able, and (when posting is connected) approvable.

---

### Generate mode

Customer gives a topic or angle. Engine does light research and produces content from scratch.

**Input examples:**
- "Write about why solo operators undervalue their time"
- "Hook: 'Most CRMs are designed for managers, not the people doing the work.'"
- "Topic: how AI is changing service businesses, my angle: most AI tools are still built for desk workers"

**What the customer does:**
1. Goes to `/app/create/generate`
2. Enters a topic (required) and optional angle/POV/hook
3. Optionally selects platforms and formats
4. Clicks Generate

**What happens:**
- The Generator agent uses Claude with web search enabled to do brief research on the topic (~3-5 searches max — this is not a research tool)
- Pulls in relevant facts, recent news, contrarian angles
- Drafts pieces from the customer's POV using their Context Stack
- Voice Validator runs the same as Repurpose mode

**What comes out:**
Same shape as Repurpose mode — a structured set of platform pieces. The only difference is the source: instead of fragmenting an existing piece, it's drafting fresh.

---

### Pipeline mode (Phase 4)

Customer sets up a content pipeline that runs autonomously on a schedule.

**Setup (one-time per pipeline):**
- Customer defines themes (3–10 topic areas they care about)
- Customer sets cadence (e.g., 3 pieces per day, or "daily X thread + 2x/week LinkedIn")
- Customer confirms platforms and modes (autopilot/approval) for each
- Customer sets duration (ongoing, 30 days, 90 days)

**What happens (ongoing):**
- Daily, the system picks one of the customer's themes (rotates intelligently — see below)
- Optionally pulls a recent angle from current events relevant to the theme
- Runs Generator mode automatically
- Pieces flow through the same Voice Validator + scheduler logic
- Customer sees pieces appear in their dashboard or approval queue

**Theme rotation:**
The system doesn't just round-robin the themes. It biases toward themes that have produced top-performing content recently (Phase 4's performance data feeds this) and away from themes posted on too recently (no spamming).

Pipeline mode is the most ambitious feature. It's also the one that most strongly justifies the "AI commerce OS in a box" positioning — set it up once, the content engine runs without you. It's intentionally Phase 4 because it requires Phase 1–3 to be rock-solid first.

---

## The agent pipeline

Regardless of input mode, every generation flows through the same pipeline:

```
INPUT (paste / topic / pipeline trigger)
    │
    ▼
┌─────────────────────────────────────┐
│  Stack Loader                       │
│  - Fetches customer's Context Stack │
│  - Composes system prompt           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Generator OR Repurposer            │
│  - Claude Sonnet                    │
│  - System prompt = customer stack   │
│  - User prompt = task + input       │
│  - Returns structured JSON          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Voice Validator                    │
│  - Claude Opus                      │
│  - Per-piece scoring                │
│  - Auto-revise pieces below threshold│
│  - Flag remaining failures          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Scheduler                          │
│  - Reads per-platform mode          │
│  - Routes autopilot pieces to queue │
│  - Routes approval pieces to queue  │
│  - Sets target post times           │
└──────────────┬──────────────────────┘
               │
               ▼
DASHBOARD (customer sees structured output)
```

---

## The agents in detail

### Stack Loader

Pure function. No Claude call. No latency to speak of.

```typescript
function loadStack(userId: string): SystemPrompt {
  const stack = db.contextStacks.findActive(userId);
  return composeSystemPrompt({
    identity: stack.identity_md,
    voice: stack.voice_md,
    audience: stack.audience_md,
    samples: stack.voice_samples,
    bannedWords: stack.banned_words,
  });
}
```

Cached aggressively. Invalidated when the customer saves their stack.

---

### Repurposer

**Model:** Claude Sonnet (cost/quality balance for high-volume work)

**System prompt:** Customer's stack (via Stack Loader)

**User prompt template (simplified):**

```
TASK: Repurpose the long-form content below into a structured set of
platform-native pieces.

LONG-FORM INPUT:
[customer's pasted content]

TARGET PLATFORMS AND FORMATS:
[from customer's selection — e.g., X thread, X long tweets, LinkedIn posts]

CONSTRAINTS:
- Each piece must stand alone (no "as I mentioned in part 1" references)
- Each piece must reflect ONE specific insight from the source
- Match platform conventions: X thread = numbered or visual flow,
  LinkedIn = scannable with line breaks, Threads = conversational
- Use the voice and audience guidance loaded in the system prompt
- DO NOT use the banned words/phrases listed in the system prompt
- DO NOT add information that isn't in the source
- For LinkedIn posts, end with a soft CTA or reflective line, not a hard CTA

OUTPUT FORMAT: Return a JSON array. Each element:
{
  "platform": "x" | "linkedin" | "threads" | etc,
  "format": "thread" | "post" | "long_tweet" | "carousel_storyboard",
  "content": string,           // the actual text
  "hook": string,              // the opening line, called out separately
  "cta": string | null,        // closing line / call to engage, if any
  "metadata": {
    "char_count": number,
    "tweet_count"?: number,    // for threads
    "rationale": string        // 1-2 sentences on why this insight from the source
  }
}
```

The structured output is critical. We don't ask Claude for "some tweets" and parse what it gives back — we get a JSON array of typed pieces. This makes the dashboard rendering trivial and makes Voice Validator's job easier.

---

### Generator

**Model:** Claude Sonnet, with web search enabled

**System prompt:** Customer's stack (via Stack Loader)

**User prompt template (simplified):**

```
TASK: Generate a structured set of platform-native pieces about the topic below.

TOPIC: [customer's topic]
ANGLE / POV (optional): [customer's hook or angle if provided]
TARGET PLATFORMS AND FORMATS: [from customer selection]

PROCESS:
1. Use web search to gather 3-5 relevant, recent data points or angles on
   the topic. Bias toward sources that would resonate with the audience
   described in the system prompt.
2. Identify the 3-5 strongest insights you could make about this topic
   given the customer's voice, audience, and POV.
3. Draft each platform piece around ONE insight.

CONSTRAINTS:
[same constraints as Repurposer]
[plus: cite sources in metadata.sources array, never in the post content]

OUTPUT FORMAT: [same JSON shape as Repurposer]
```

Web search is capped at 5 calls per generation to control cost and latency. If the topic is genuinely complex, the Generator can do a second round of searches on follow-up clarifications, but the budget is tight by design — this is a content engine, not a research tool.

---

### Voice Validator

**Model:** Claude Opus (this is the quality gate; we spend more compute here)

**Triggered:** Automatically after Repurposer or Generator

**Per-piece system prompt:**

```
You are evaluating a piece of content against a writer's voice profile.

VOICE PROFILE:
[voice samples, banned words, voice description from customer's stack]

PIECE TO EVALUATE:
[the generated content]

PRODUCE:
{
  "voice_match_score": 0-100,
  "drift_flags": [
    { "line": string, "reason": string, "severity": "low"|"medium"|"high" }
  ],
  "banned_word_violations": [
    { "word": string, "context": string }
  ],
  "suggested_revision": string | null  // if score < threshold, propose a fix
}

SCORING GUIDANCE:
- 90+: Reads like a strong example from the voice samples
- 70-89: Acceptable, minor drift in 1-2 places
- 50-69: Noticeable drift, would need editing before posting
- <50: Sounds generic or off-voice, should be regenerated
```

If `voice_match_score < customer_threshold`, the piece is auto-revised once using `suggested_revision`. After revision, the Validator runs again. If it's still below threshold, the piece is staged with a "voice warning" badge — the customer sees it but it's flagged.

The customer-configurable threshold is in settings. Default 70. Strict customers can set it to 85 (more regenerations, higher cost, higher quality). Loose customers can set it to 50 (fewer regenerations, faster, lower quality).

---

### Scheduler

Pure function. No Claude call.

For each piece coming out of the Validator:

```typescript
function schedulePiece(piece: ContentPiece, user: User): JobAssignment {
  const platformConn = db.platformConnections.findActive(user.id, piece.platform);

  if (!platformConn) {
    // Customer hasn't connected this platform — stage as draft only
    return { status: 'drafted', scheduled_for: null };
  }

  if (platformConn.mode === 'autopilot') {
    return {
      status: 'approved',
      scheduled_for: nextAvailablePostSlot(user.id, piece.platform),
    };
  }

  // approval mode
  return {
    status: 'pending_approval',
    scheduled_for: null,  // set when approved
    notify: true,
  };
}
```

`nextAvailablePostSlot` is the smart scheduling logic — see "Posting cadence" below.

---

### Poster

The job that actually pushes content to platforms.

For each platform, a per-platform adapter handles the API differences. The pattern:

```typescript
interface PlatformAdapter {
  post(piece: ContentPiece, credentials: Credentials): Promise<PostResult>;
  getMetrics(postId: string, credentials: Credentials): Promise<Metrics>;
}
```

In Phase 1 there are no adapters (no posting). In Phase 2, the X adapter ships. In Phase 3, LinkedIn. Phase 4 adds Threads, IG, plus the Buffer/Publer fallback for hostile-API platforms.

Failures retry 3x with exponential backoff. Permanent failures are logged, customer is notified, piece is marked `failed`.

---

## Posting cadence

When pieces are approved (or generated in autopilot mode), they don't all post at once. The Scheduler spreads them across the day with sensible spacing.

Default rules (customer-configurable):

- **Per platform max per day:** 5 (X), 2 (LinkedIn), 3 (Threads), 1 (IG)
- **Minimum gap between same-platform posts:** 90 minutes
- **Posting window:** 7am–9pm in customer's timezone
- **No posting on weekends** for LinkedIn (configurable)

If a generation produces more pieces than fit in the daily quota, excess pieces queue up for subsequent days. Customer sees "scheduled for [day]" badges on each piece.

---

## Cost & rate limiting

Every generation has a cost — Claude API tokens, and (for Generate mode) web search calls. Costs are metered per user.

Per the existing Threads cost cap pattern, each user has:

- A daily cost cap (default $5/day, tier-dependent)
- A monthly cost cap (default $50/month, tier-dependent)
- A cost pill in the UI showing today's spend

When a user hits their daily cap, generations queue with a "tomorrow" badge. They can override in settings if they want to burn through their monthly cap faster.

This protects us from runaway costs and gives customers honest visibility into AI spend. The cap is also the natural enforcement mechanism for tier upgrades.

---

## What the customer sees while a generation runs

The generation flow is async — typically 30-90 seconds for Repurpose mode, 60-180 seconds for Generate mode (web search adds latency).

The UI during generation:

1. Customer clicks Generate
2. Page transitions to a generation status view
3. Shows pipeline stages with checkmarks as each completes:
   - ✅ Loading your context
   - ⏳ Drafting pieces (or "Researching" for Generate mode)
   - ⏳ Voice check
   - ⏳ Scheduling
4. As pieces become available, they stream into the view (don't wait for all to complete)
5. Final state: dashboard view with all pieces, ready to copy/approve/edit

Streaming pieces in as they're produced (rather than blocking until all are done) is a meaningful UX improvement — customers feel progress instead of waiting at a spinner.

---

## What's intentionally NOT in the engine

To keep the scope tight and the product disciplined:

- **No image generation.** Customers can paste image URLs into pieces; we don't generate images. (Pixa, Midjourney exist for that.)
- **No video editing or captioning.** Submagic / quso.ai do this well; we focus on text.
- **No A/B testing in v1.** Phase 4 maybe, post-launch maybe, not now.
- **No cross-platform thread stitching** ("turn this X thread into a LinkedIn post that links back to the X thread"). Each piece stands alone.
- **No competitor monitoring or trend hijacking.** Different product.
- **No SEO content (long-form blog generation).** Different product. We do social.

The discipline of saying no is what keeps IrieStack from sprawling into a generic AI marketing suite.
