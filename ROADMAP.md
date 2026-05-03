# Roadmap

This document phases the IrieStack build into shippable chunks. Each phase has a clear definition of done, a clear "is this sellable yet" answer, and a clear set of next-phase triggers.

The phases are sequenced so that you can stop at any boundary and still have a usable thing — either for personal use, alpha testers, or paying customers.

---

## Guiding principles for the build order

Before the phases, the principles that drive the order:

1. **Build the moat first.** The Context Stack is what makes IrieStack different. It ships in Phase 1 even though nothing else is connected, because it's the asset that compounds.
2. **Earn trust before automating.** The approval queue ships before autopilot. Customers (and you) trust the system more after watching it draft well manually for a while.
3. **Match the existing Irie pattern.** Threads → IC → Suite all followed the same arc: working internally first, then dogfooded, then opened up. IrieStack does the same.
4. **Don't ship platform connectors until the content is good.** A bad post that goes out automatically is worse than a good post that requires copy/paste.

---

## Phase 1 — Foundation

**Definition of done:** A single user can sign up, complete the bootstrap interview, paste long-form content, and receive 20+ platform-formatted pieces in the dashboard. No posting yet — output is copy-pasteable.

**What gets built:**

- Marketing site (single landing page, pricing TBD, signup CTA)
- Auth (Supabase Auth — email magic link + Google OAuth)
- Onboarding flow with bootstrap interview chat UI
  - Generates the customer's Context Stack
  - Lets them edit it manually after the interview
  - Saves to `context_stacks` table
- Stack editor (CRUD on the four layers)
- Repurpose mode end-to-end:
  - Paste textarea
  - Triggers job
  - Calls Stack Loader → Repurposer → Voice Validator
  - Returns structured pieces
  - Displays in a clean output dashboard with copy buttons per piece
- Job runner infrastructure (Inngest or simple Postgres queue)

**What's NOT in Phase 1:**
- No platform connections
- No posting
- No approval queue (everything just shows up in the dashboard)
- No Generate mode
- No Pipeline mode
- No performance tracking
- No billing

**Sellable?** No. This is alpha. Use it yourself, give it to 3–5 trusted testers.

**Trigger to move to Phase 2:** You've used it personally for at least 2 weeks, the output quality is consistently good, and you've ironed out the obvious onboarding friction.

**Estimated build size:** ~2 weeks of focused Claude Code sessions.

---

## Phase 2 — The Approval Layer

**Definition of done:** Customer can connect their first platform (X), choose autopilot or approval mode for it, and approve queued pieces from a web dashboard or via Telegram. Pieces in approval mode get posted directly to X after approval.

**What gets built:**

- X (Twitter) platform connector
  - OAuth connection flow
  - Direct posting via API
  - Per-platform mode toggle in settings (autopilot/approval)
- Approval queue dashboard
  - List of `pending_approval` pieces
  - Approve / reject / edit-then-approve actions
  - Each action logged to `approvals_log`
- Telegram bot
  - One-time pairing flow
  - Sends notification when something is pending
  - Inline buttons for approve/reject
  - Reply with text to edit before approving
- Generate mode (topic-in)
  - Topic input + optional angle/style hints
  - Calls Generator instead of Repurposer
  - Otherwise same flow
- Basic billing scaffolding (Stripe)
  - Free trial
  - One paid tier (price TBD)
  - Usage limits per tier

**What's NOT in Phase 2:**
- Only X is connected (LinkedIn comes in Phase 3)
- No autopilot for any platform yet (autopilot toggle exists in UI but everything still requires approval)
- No performance tracking
- No Pipeline mode

**Sellable?** Yes — early beta. Soft launch to a waitlist of 20–50 people. Pricing should be intentionally low or invite-only.

**Trigger to move to Phase 3:** 10+ paying beta customers, retention through month 2 is healthy, X integration is reliable.

**Estimated build size:** ~3 weeks.

---

## Phase 3 — The Autopilot Layer

**Definition of done:** Autopilot mode actually works, on at least two platforms (X + LinkedIn). Customers can fully delegate posting on platforms they trust. Real billing is live.

**What gets built:**

- Autopilot mode flips on
  - When platform mode = autopilot, pieces skip approval and go straight to scheduled posting
  - Smart scheduling (don't post 5 things in 5 minutes — spread across the day with sensible gaps)
- LinkedIn platform connector
  - OAuth, direct posting, profile + company page support
- Stripe billing live
  - Three tiers: Starter / Growth / Scale (matching the Irie ecosystem pattern)
  - Usage metering — generations per month, platforms connected, autopilot enabled or not
- Public marketing site upgraded
  - Real homepage, demo video, customer testimonials from beta
  - Pricing page
  - Live signups, no waitlist
- Settings UX matures
  - Per-platform mode toggle is prominent
  - Safety rails — "are you sure" confirmation when flipping a platform to autopilot the first time
  - Pause-all kill switch (one button stops all posting)

**What's NOT in Phase 3:**
- Still no IG / TikTok / Threads (they're in Phase 4)
- No performance feedback into the engine yet (data is captured but not used)
- No Pipeline mode

**Sellable?** Yes — public launch. This is v1.0 and the first version pitched broadly.

**Trigger to move to Phase 4:** Steady customer base, clear feedback on what to add next, X+LinkedIn workflow is rock solid.

**Estimated build size:** ~4 weeks.

---

## Phase 4 — The Intelligence Layer

**Definition of done:** The system learns from each customer's posting performance and biases future generations toward what works for them. Pipeline mode runs autonomously. More platforms connected.

**What gets built:**

- Performance Tracker activates
  - Daily cron pulls metrics from connected platforms
  - Stores in `performance_snapshots`
  - Per-piece performance visible in dashboard
- Engine learning loop
  - When generating new content, system reads the customer's top 20 performing pieces and biases toward those formats/hooks/structures
  - Voice Validator gets stronger signal from approve/reject + performance data
- Pipeline mode
  - Customer gives the system a set of themes/topics they care about
  - System generates content on a schedule (e.g., 3 pieces per day across platforms)
  - All pieces flow through the same approval/autopilot logic
- Threads + Instagram connectors
  - Direct API integration
  - IG limited to business accounts (Meta's restriction, not ours)
- Buffer/Publer integration
  - For TikTok and any other hostile-API platform
  - Customer connects their Buffer account, IrieStack queues to it instead of posting directly

**What's NOT in Phase 4:**
- No team/agency accounts
- No white-label
- No A/B testing of variations (still on the maybe-list)

**Sellable?** Yes — this is the mature product. Phase 4 done = real differentiation.

**Trigger to move beyond Phase 4:** Customer demand drives it. Possibilities include team tier, API access for developers, white-label for agencies, multi-language support. None are committed.

**Estimated build size:** ~6 weeks.

---

## What's perpetually on the back burner

These are real ideas that will keep coming up. Their place is documented here so they don't derail the main build:

- **Mobile native app** — mobile web is good enough until it isn't. Reassess at 1000 paying customers.
- **Multi-language voice support** — the Context Stack works in any language, but the UI is English-only for v1.
- **AI image generation in posts** — interesting but solved by other tools (Pixa, Midjourney). Integration via "paste image URL" is fine for v1.
- **Video / Hormozi-style captions** — separate problem space. Possible v2 add-on or partnership.
- **Built-in analytics dashboard with charts** — explicitly out of scope. Phase 4's performance tracker exists to feed the engine, not to be a Sprout Social replacement.
- **Browser extension for one-click repurpose from any page** — would be cool, post-Phase-4 maybe.

---

## How to read progress

A simple way to track where IrieStack is at any moment:

| Capability | Phase | Status |
|------------|-------|--------|
| Sign up & onboard | 1 | Not started |
| Build a Context Stack | 1 | Not started |
| Paste long content → get pieces | 1 | Not started |
| Connect X | 2 | Not started |
| Approve pieces (web + Telegram) | 2 | Not started |
| Topic → researched content | 2 | Not started |
| Pay for it | 2 | Not started |
| Autopilot on X + LinkedIn | 3 | Not started |
| Connect Threads + IG | 4 | Not started |
| Engine learns from your performance | 4 | Not started |
| Fully autonomous content pipeline | 4 | Not started |

This table lives at the top of the repo's project board / Linear / wherever the work is tracked. Update it as things ship.

---

## What I'd build first, concretely

If I were sitting down to write the first Claude Code prompt for IrieStack tomorrow, this is what I'd scope:

**First prompt scope (Phase 1, Slice 1):**
- Next.js 15 scaffold with Tailwind, deployed to Vercel preview branch
- Supabase project initialized with `users`, `context_stacks`, `jobs` tables and basic RLS
- Marketing landing page (single page, hero + 3-section explainer + waitlist signup)
- Auth wired up (magic link + Google OAuth)
- Empty `/app` shell behind auth with "Welcome, your stack is empty, let's build it" placeholder

That's a sub-1-week piece of work. After it ships and the preview URL is walked, the second prompt builds the bootstrap interview chat UI. Then the Repurposer. Then the dashboard. Each one a discrete prompt, each one preview-branch-first.

This is documented here so the moment you say "let's start building," there's already a clear first move.

---

## Open decisions blocking Phase 1

- [ ] Database — Option A (new Supabase project) confirmed?
- [ ] Repo created on GitHub under your account, named `IrieStack`?
- [ ] Vercel project created under team `team_BUfbPxIbyANfrNIYoWhuMg9Z`?
- [ ] Whether you want me to draft the Phase 1 Slice 1 Claude Code prompt now, or wait until you've reviewed README + ARCHITECTURE + ROADMAP and approved.

Once these are answered, the build starts.
