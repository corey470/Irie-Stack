# IrieStack

**One idea in. A week of content out. On your voice, on your terms.**

IrieStack is a SaaS that turns a single piece of long-form content (or a single topic) into a full week of platform-native posts, runs on autopilot or approval mode toggleable per channel, and gets sharper every week through a context system the customer builds once and refines forever.

It's the productized version of what Alex Hormozi described in April 2026: stop writing better prompts, start building context systems. IrieStack does the context-system part for the customer, runs the engine, and either posts directly or hands the customer an approval queue — their choice, per platform.

---

## The problem

Most people creating content for their business hit the same three walls:

1. **The volume wall.** They know they should be posting 5–20 times a week across multiple platforms. They post 2 a week and wonder why nothing grows.
2. **The voice wall.** They try AI tools and the output sounds like AI — generic, hollow, not them. They spend more time editing than they would have spent writing.
3. **The trust wall.** They don't trust AI to post on their behalf. So they either don't use AI at all, or they use it and review every single piece manually, which kills the volume gains.

IrieStack solves all three:

- **Volume** — one input becomes 20+ pieces, automatically platform-formatted.
- **Voice** — the customer's Context Stack loads on every generation. The output sounds like them because the AI knows them.
- **Trust** — per-platform autopilot/approval toggle. Customer dials trust up where they're confident, keeps it tight where they're not.

---

## How it works (the customer's view)

### Step 1 — Onboard (15 minutes, once)

The customer goes through the bootstrap interview. The system asks ~15 sharp questions about who they are, how they sound (with writing samples), and who their audience really is. The output is their Context Stack — the four-layer document that loads on every future session.

This is the moat. The longer they use IrieStack, the more refined their stack gets, and the more the output compounds.

### Step 2 — Feed it something

The customer can use any of three input modes:

- **Repurpose mode** — paste a long-form piece (newsletter, transcript, blog post, podcast notes). IrieStack fragments it into 20+ platform-native pieces.
- **Generate mode** — give a topic or angle. IrieStack researches, drafts, and produces content from scratch.
- **Pipeline mode** — fully autonomous. IrieStack picks topics from the customer's themes, generates content on a schedule, and runs the loop.

### Step 3 — Choose the trust level (per platform)

For each connected platform, the customer toggles:

- **Autopilot** — IrieStack drafts and posts directly.
- **Approval Queue** — IrieStack drafts, customer approves via web dashboard or Telegram, then it posts.

The toggle is per-platform. A customer might run X on autopilot (low stakes, high volume) and LinkedIn on approval (high stakes, slower cadence).

### Step 4 — Watch it work

The dashboard shows what's been posted, what's queued, what's pending approval, and how each piece is performing. Performance data feeds back into the engine so future generations get smarter.

---

## Who this is for

The customer this is built for has these traits:

- **Solo or small-team operator** — founder, consultant, coach, creator, agency owner.
- **Already has a voice they care about** — they're not trying to ghost-write a generic brand. They're trying to be omnipresent as themselves.
- **Has long-form raw material already** — newsletters, podcast episodes, YouTube videos, blog posts. They're sitting on content gold and only mining 5%.
- **Wants control without manual labor** — they want to direct the work, not do the work.

This is **not** for: enterprise marketing teams, social media agencies running 50 client accounts, or people who want to set up an automated faceless content farm. Those are different products.

---

## What's in this repo

```
Irie_Stack/
├── README.md                    ← this file
├── ARCHITECTURE.md              ← the system map (read second)
├── ROADMAP.md                   ← phased build plan (read third)
├── DESIGN.md                    ← visual design tokens & patterns
├── PSYCHOLOGY.md                ← how the UI should feel
├── VERIFICATION.md              ← (extracted later — proof requirements)
├── docs/
│   ├── 01-the-context-layer.md
│   ├── 02-the-engine.md
│   ├── 03-the-control-plane.md
│   ├── 04-platform-connectors.md
│   └── 05-pricing-tiers.md
├── prompts/
│   ├── bootstrap-interview.md
│   ├── repurposer.md
│   ├── generator.md
│   └── voice-validator.md
├── context-stack-template/      ← the 5-file package (the customer-facing version)
└── .claude-prompts/             ← prompts handed to Claude Code during build
```

---

## Tech stack (decided)

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind. Match the Irie ecosystem standard.
- **Hosting:** Vercel, team `team_BUfbPxIbyANfrNIYoWhuMg9Z`.
- **Database:** TBD — see ARCHITECTURE.md for the three options. My recommendation is **its own new Supabase project** under the existing org. Alternatives: Convex (already used by Mission Control) or Postgres-on-Vercel.
- **Auth:** Supabase Auth (or whatever the DB decision lands on). Google OAuth + email magic link.
- **AI:** Anthropic Claude API (primary), with model selection per task — Haiku for cheap classification, Sonnet for content generation, Opus for complex reasoning like Voice Validation.
- **Scheduling/queueing:** Inngest or a simple cron + DB queue. Decided in Phase 2.
- **Platform connectors:** Direct API integrations where available (X, LinkedIn, Threads). Buffer/Publer integration as a fallback for platforms with hostile APIs (TikTok, IG).

---

## Domain

TBD. Candidates:

- `iriestack.com`
- `iriestack.ai`
- `iriestack.io`

Decision deferred until Phase 2 launch.

---

## Workflow rules (standing, all sessions)

These are the rules every session of building IrieStack follows. They match the existing Irie ecosystem standard and are not negotiable.

1. **Preview branch first, always.** Nothing merges to `main` without Corey walking the live preview URL and approving the merge.
2. **Reality Checker runs once, at the end of a complete build,** walking the live preview URL (not code, not logs), before merge to production only.
3. **Claude Code prompts** are delivered as a single code block with the full specialist roster, one push per session, rewrite the whole prompt on changes. FIX-ON-FIND for clearly safe in-scope issues. Risky or out-of-scope findings get flagged at the bottom of the prompt output, never silently fixed.
4. **Every UI-touching prompt** must explicitly reference DESIGN.md AND PSYCHOLOGY.md as a pair. Once VERIFICATION.md is extracted, that gets added to the trio.
5. **Mobile-first audit** is part of every UI build — clamp() typography, 44px touch targets, no exceptions.
6. **Never use lucide-react brand icons** (Facebook, Twitter, Instagram, GitHub, LinkedIn, YouTube). Inline SVG only. Grep before using lucide for any social icon.
7. **Git/Vercel hygiene:** global git config must be `coreystewardtraining@gmail.com`. Watch for SidandFoxxy contributor blocks and YOUR_GITHUB_EMAIL placeholder commits.
8. **"Do not ask Corey to intervene unless all options are exhausted."**
9. **North star:** *It just needs to be Irie.*

---

## What this product is NOT

To stay disciplined as we build, here's the explicit out-of-scope list:

- **Not a social media management dashboard** (Buffer, Hootsuite). It generates and posts; it doesn't replace your scheduling tool unless you want it to.
- **Not a content calendar tool** (Notion, Trello). You can see what's queued, but planning long-term editorial strategy isn't the job.
- **Not an analytics platform** (Sprout, Sparktoro). Performance tracking exists to feed the engine, not to give you 47 charts.
- **Not a multi-client agency tool** (Sendible, Loomly). Single-user-focused for v1. Multi-user agency tier comes later, if ever.
- **Not a video editor.** Hormozi-style captioning is a separate problem solved by separate tools (Submagic, quso.ai). IrieStack writes the words; the video tools format them.

Discipline on the "not" list is what keeps the product from bloating into another generic AI marketing suite.

---

## Read next

- `ARCHITECTURE.md` — the system map, database decision, agent layer, data flow
- `ROADMAP.md` — the phased build plan, what ships when
