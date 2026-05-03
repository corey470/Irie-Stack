# Architecture

This document describes the system shape of IrieStack — what the components are, how they talk to each other, where data lives, and what decisions still need to be made.

It's organized so you can read it top-to-bottom for the full picture, or jump to a specific section if you're answering a specific question.

---

## The system at 30,000 feet

```
┌────────────────────────────────────────────────────────────────┐
│  CUSTOMER                                                      │
│  Browser, mobile web, Telegram bot                             │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│  FRONTEND (Next.js on Vercel)                                  │
│  - Marketing site (/, /pricing, /about)                        │
│  - App (/app/*)                                                │
│    - Onboarding (bootstrap interview UI)                       │
│    - Stack editor                                              │
│    - Content trigger (paste / topic / upload)                  │
│    - Approval queue                                            │
│    - Performance dashboard                                     │
│    - Settings (per-platform mode, connections)                 │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│  API LAYER (Next.js Route Handlers)                            │
│  - /api/auth/*                                                 │
│  - /api/stack/* (CRUD on customer's Context Stack)             │
│  - /api/generate/* (trigger repurpose/generate/pipeline)       │
│  - /api/queue/* (approval actions)                             │
│  - /api/platforms/* (connect/disconnect, post)                 │
│  - /api/webhooks/* (incoming from Telegram, platforms)         │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│  ENGINE (the agent layer)                                      │
│  - Stack Loader: pulls customer's Context Stack into prompt    │
│  - Repurposer: long input → multi-platform pieces              │
│  - Generator: topic → researched content                       │
│  - Voice Validator: QA pass — does this sound like them?       │
│  - Scheduler: routes pieces to autopilot vs approval queue     │
│  - Poster: pushes to platforms when approved/triggered         │
│  - Performance Tracker: pulls metrics, feeds back to engine    │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│  EXTERNAL                                                      │
│  - Anthropic API (Claude)                                      │
│  - X API, LinkedIn API, Threads API, IG API, etc.              │
│  - Buffer/Publer API (fallback for hostile-API platforms)      │
│  - Telegram Bot API                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## The database decision

This is the open call you flagged. Three real options, ranked by my recommendation:

### Option A — New Supabase project (RECOMMENDED)

Spin up a fourth Supabase project under the existing organization, dedicated to IrieStack. Tenant data lives there. Auth handled by Supabase Auth.

**Pros:**
- Same patterns Corey already knows from Threads/IC/Suite — no new mental model.
- Row-level security for multi-tenant isolation is battle-tested.
- Supabase Auth + magic links + Google OAuth work out of the box.
- Storage included for any media uploads (transcripts, images, etc.).
- Realtime subscriptions for the approval queue (live updates without polling).

**Cons:**
- Adds a fourth Supabase project to manage (Threads `tdrgnwrxejjmlhyjzxpl`, IC `fdahqnijwxmjathgdtnn`, Suite `povyxvsxnudcnemltbrg`, IrieStack `[new]`).
- More monthly cost on Supabase (Pro tier per project).
- More schema to maintain across the ecosystem.

**Verdict:** Worth it. The cost of a fourth project ($25/mo) is rounding error compared to the cost of context-switching between two database paradigms. Sellable SaaS needs proper isolation from your other products anyway.

### Option B — Convex

Convex is already in use by Mission Control. It's a real-time-first backend with a different mental model than Supabase (TypeScript-defined schemas, reactive queries, integrated function runtime).

**Pros:**
- Already a paid account in the ecosystem.
- Excellent for real-time UIs (the approval queue would feel snappier).
- TypeScript end-to-end, no SQL.
- Integrated function runtime means agent jobs can live next to the data.

**Cons:**
- Different paradigm than the rest of the ecosystem — Corey would be maintaining two database mental models long-term.
- Less battle-tested for multi-tenant SaaS than Supabase.
- Auth is Convex Auth or Clerk integration — another component to wire up.
- Pricing scales differently and can get expensive on heavy reads.

**Verdict:** Strong fit for a real-time-heavy app, but the cost is mental overhead. Only worth it if real-time is the killer feature, which it probably isn't here.

### Option C — Postgres on Vercel + Drizzle/Prisma

Use Vercel's Postgres offering (Neon under the hood) with Drizzle ORM. Roll your own auth via NextAuth or Clerk.

**Pros:**
- Stays inside the Vercel ecosystem — one less vendor.
- Cheaper at low scale.
- Full schema control without Supabase's conventions.

**Cons:**
- Way more wiring — auth, RLS equivalent, file storage, realtime — all DIY.
- Loses the ergonomics of Supabase Studio for quick data inspection.
- More moving parts means more things to break.

**Verdict:** Only if you're trying to minimize external dependencies. Not recommended.

### My pick

**Option A — new Supabase project.** It's the path with the lowest cognitive cost and the highest production reliability. The fourth project is a real but small ongoing cost; the time you'd spend learning Convex's quirks for a non-real-time-critical app is bigger.

If you want to push back on this and go Convex anyway, the case for it is "build a more differentiated stack and lean into real-time UX." Both are defensible. But absent a strong push, default to Supabase.

**Action item for you:** confirm Option A or flag a different choice. The rest of this document assumes A.

---

## Data model (high level)

The schema below is conceptual — actual migrations get written in Phase 1. This shows what entities exist and how they relate.

```
users
  id, email, name, created_at, telegram_id, plan_tier

context_stacks
  id, user_id, identity_md, voice_md, audience_md, version, updated_at
  (one active stack per user, version-bumped on edit, history preserved)

content_sources
  id, user_id, type ('paste'|'topic'|'pipeline'), input_text, input_metadata, created_at

content_pieces
  id, source_id, user_id, platform, format, draft_text, draft_metadata,
  status ('drafted'|'pending_approval'|'approved'|'posted'|'rejected'|'failed'),
  scheduled_for, posted_at, posted_url, performance_data (jsonb), created_at

platform_connections
  id, user_id, platform, mode ('autopilot'|'approval'), credentials (encrypted),
  connected_at, last_used_at, status

approvals_log
  id, user_id, piece_id, action ('approve'|'reject'|'edit'), reason, created_at

performance_snapshots
  id, piece_id, captured_at, metrics (jsonb), source ('platform_api'|'manual')

jobs
  id, user_id, type, status, payload, scheduled_for, started_at, completed_at,
  error_log
  (the queue table — every async task lands here first)
```

---

## The agent layer in detail

The "agents" in IrieStack aren't autonomous Claude instances roaming free. They're structured prompt+function pairs that do one thing well. Each runs in the API/job layer.

### Stack Loader
**Job:** Read the customer's Context Stack from the DB and inject it as the system prompt for any downstream call.
**Why it matters:** This is the thing that makes the output sound like the customer. Every other agent depends on it.
**Implementation:** Pure function, no Claude call. Returns a formatted system prompt.

### Repurposer
**Job:** Take a long-form input + the customer's stack, output a structured set of platform pieces.
**Output shape:** JSON array of `{platform, format, content, hook, cta}` objects. Targeting roughly: 1 X thread, 3–5 X long-tweets, 3–5 LinkedIn posts, 1 IG carousel storyboard, 1 Threads post set.
**Model:** Claude Sonnet (cost/quality balance).

### Generator
**Job:** Take a topic + the customer's stack, do light research (web search tool), produce content.
**Output shape:** Same as Repurposer.
**Model:** Sonnet, with web search enabled.

### Voice Validator
**Job:** Read the generated content and the customer's voice samples, score how well it matches, flag pieces that drift.
**Output shape:** Per-piece score 0-100 + flagged sections + suggested edits.
**Model:** Opus (this is the quality gate, worth spending compute on).
**Trigger:** Runs automatically after Repurposer/Generator. Pieces below threshold get auto-revised once before being staged.

### Scheduler
**Job:** Look at each generated piece, check the customer's per-platform mode, route accordingly.
- Autopilot mode → straight to Poster job queue with a target post time.
- Approval mode → into `pending_approval` status, notification fired (web + Telegram).
**Implementation:** Pure function, no Claude call.

### Poster
**Job:** Take an approved piece and post it to the platform. Capture the resulting URL and post ID.
**Implementation:** Per-platform adapters. X, LinkedIn, Threads in Phase 1. IG/TikTok in Phase 2 (likely via Buffer fallback).
**Failure handling:** Retry 3x with exponential backoff, then mark `failed` and notify customer.

### Performance Tracker
**Job:** On a daily schedule, pull metrics for posted pieces from each platform's API. Store in `performance_snapshots`.
**Why it matters:** Closes the loop. Phase 4 uses this data to bias the engine toward formats/topics/hooks that work for that specific user.
**Implementation:** Cron job (Inngest or Vercel Cron).

---

## Data flow (typical request)

Here's what happens when a customer pastes a newsletter and clicks "Repurpose":

1. **Frontend** — POSTs newsletter text to `/api/generate/repurpose`.
2. **API** — Validates input, creates a `content_sources` row, creates a `jobs` row, returns job ID. Frontend starts polling/subscribing for job status.
3. **Job runner** — Picks up the job. Calls Stack Loader → gets system prompt. Calls Repurposer with system prompt + input. Receives structured output.
4. **Voice Validator** — Runs against each piece. Anything below threshold auto-revises once.
5. **Scheduler** — Reads each piece's target platform, looks up customer's mode for that platform.
   - Autopilot pieces → status `approved`, scheduled for posting.
   - Approval pieces → status `pending_approval`, notifications fired.
6. **Frontend** — Receives job-complete event, refreshes the dashboard. Customer sees the queue with each piece labeled by status.

---

## Authentication & multi-tenancy

- Supabase Auth handles signup/signin via email magic link and Google OAuth.
- Every table has `user_id` and Row-Level Security policies enforce that users can only read/write their own rows.
- Service-role key is used by background jobs (job runner, performance tracker) — never exposed to the client.
- Telegram bot pairing happens via a one-time token: customer generates a code in the app, sends it to the bot, bot binds the Telegram ID to the user account.

---

## Platform connector strategy

Platforms vary wildly in API friendliness. Strategy by platform:

| Platform | API Status | Phase | Approach |
|----------|-----------|-------|----------|
| X (Twitter) | Paid API, workable | 1 | Direct integration |
| LinkedIn | Restrictive but workable | 1 | Direct integration |
| Threads | Meta's API, workable | 2 | Direct integration |
| Instagram | Restrictive, business accounts only | 2 | Direct integration via Meta Graph |
| TikTok | Hostile API for posting | 3 | Buffer/Publer fallback |
| YouTube Shorts | OK via Data API | 3 | Direct integration |
| Substack | No API | 3 | Email-to-post or manual export |

For platforms where direct posting is blocked or unreliable, we generate the content and provide one-click copy + schedule to Buffer/Publer (which the customer would connect separately).

---

## What's intentionally NOT in v1

These come up but are explicitly deferred:

- **Multi-user / team accounts** — single user only in v1. Agency tier later if there's demand.
- **White-label / reseller** — no.
- **Custom AI model selection** — Claude only. No "bring your own OpenAI key."
- **Browser extension** — no. Web app only.
- **Mobile native app** — no. Mobile web is the answer for v1.
- **A/B testing of variations** — interesting but Phase 4+.
- **Content library / asset management** — not the job. Use Notion or Drive.

---

## Open questions still to resolve

- [ ] Database — confirm Option A (new Supabase project) or push back.
- [ ] Domain — `iriestack.com` vs `.ai` vs `.io`.
- [ ] Pricing tiers — see `docs/05-pricing-tiers.md` (to be written in Phase 2).
- [ ] Telegram bot — same bot as Ziggy, or new dedicated IrieStack bot? (Recommend new bot — clear product separation.)
- [ ] Whether the Context Stack onboarding interview runs as a chat UI or a guided form. (Recommend chat UI — feels more like the Hormozi pattern and gives better answers.)

---

## Read next

- `ROADMAP.md` — what ships in what phase, what's sellable when.
