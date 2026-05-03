# Folder Map

A guide to what's in this folder and what to read first.

---

## The structure

```
Irie_Stack/
├── FOLDER-MAP.md                     ← you are here
├── README.md                         ← what IrieStack is, who it's for
├── ARCHITECTURE.md                   ← the system map, tech decisions
├── ROADMAP.md                        ← phased build plan
│
├── docs/                             ← deep-dive specs (referenced from above)
│   ├── 01-the-context-layer.md
│   ├── 02-the-engine.md
│   ├── 03-the-control-plane.md
│   ├── 04-platform-connectors.md
│   └── 05-pricing-tiers.md
│
└── context-stack-template/           ← the customer-facing onboarding module
    ├── README.md
    ├── 01-the-stack.md
    ├── 02-bootstrap-interview.md
    ├── 03-deployment.md
    └── 04-maintenance.md
```

---

## What each file is

### Top level (the spec)

**README.md** — Product overview. What IrieStack is, who it's for, what it isn't. Start here.

**ARCHITECTURE.md** — The system map. Database decision, agent layer, data flow, schema sketch, auth approach. Read this second.

**ROADMAP.md** — Phased build plan. Phase 1 through Phase 4, what ships when, what's sellable when. Read this third.

### `docs/` (the deep dives)

These are referenced from README and ARCHITECTURE. Read them when you need detail on a specific area.

**01-the-context-layer.md** — How the customer's Context Stack lives inside the product. Storage, the Stack Loader, the Voice Validator quality gate, how the stack evolves.

**02-the-engine.md** — How Repurpose / Generate / Pipeline modes work end-to-end. Agent prompts, structured output format, posting cadence, cost control.

**03-the-control-plane.md** — The trust layer. Autopilot vs approval, per-platform toggle, approval queue, Telegram bridge, kill switches.

**04-platform-connectors.md** — Per-platform integration strategy. X, LinkedIn, Threads, IG, TikTok, YouTube. What's direct, what's via Buffer fallback, what's deferred.

**05-pricing-tiers.md** — Starter / Growth / Scale structure. Pricing philosophy, what's in each tier, free trial, cost caps, overage handling.

### `context-stack-template/` (the customer-facing module)

This is the standalone Context Stack package — the thing customers will interact with during onboarding, productized inside IrieStack later. It can also be used by anyone outside IrieStack as a tool-agnostic module.

**README.md** — What the Context Stack is and why it works.

**01-the-stack.md** — The fillable four-layer template (Identity / Voice / Audience / Task).

**02-bootstrap-interview.md** — A self-contained prompt that, when pasted into any LLM, runs a 15-minute interview and outputs a filled stack.

**03-deployment.md** — How to load a filled stack into ChatGPT, Claude, Cursor, Cowork, n8n, or anywhere else.

**04-maintenance.md** — How to keep the stack alive over time (weekly check-in, quarterly review).

---

## Recommended reading order

**If you want the big picture (15 min read):**
1. `README.md`
2. `ARCHITECTURE.md`
3. `ROADMAP.md`

**If you want to understand the product deeply (60 min read):**
1. `README.md`
2. `ARCHITECTURE.md`
3. `docs/01-the-context-layer.md`
4. `docs/02-the-engine.md`
5. `docs/03-the-control-plane.md`
6. `docs/04-platform-connectors.md`
7. `docs/05-pricing-tiers.md`
8. `ROADMAP.md`

**If you want to use the Context Stack module right now (independent of building IrieStack):**
1. `context-stack-template/README.md`
2. `context-stack-template/02-bootstrap-interview.md` — paste into any LLM, run the interview, get your stack

---

## What's not in this folder yet

These are planned next, in this order:

1. **DESIGN.md + PSYCHOLOGY.md** — the visual design system and feel-of-the-product docs (your standing rule for any UI work)
2. **prompts/** — the production prompts each engine agent will use (bootstrap-interview, repurposer, generator, voice-validator)
3. **VERIFICATION.md** — extracted later, paired with DESIGN/PSYCHOLOGY for the three-file UI prompt standard
4. **The first Claude Code build prompt** — once infrastructure is set up (GitHub repo, Vercel project, new Supabase project)

---

## What still needs to happen before code gets written

- [ ] You create the GitHub repo `IrieStack`
- [ ] You create the Vercel project under team `team_BUfbPxIbyANfrNIYoWhuMg9Z`
- [ ] You create a new Supabase project for IrieStack (its own life, its own land, confirmed)
- [ ] DESIGN.md + PSYCHOLOGY.md drafted
- [ ] Production prompts drafted
- [ ] First Claude Code build prompt drafted

Then Phase 1, Slice 1 ships.
