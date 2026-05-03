# 01 — The Context Layer

The Context Layer is what makes IrieStack different from every other AI content tool on the market. It's the moat. This document explains what it is, how it works inside the product, and how it evolves over time.

If you've read the standalone Context Stack package (the five-file module IrieStack is built around), some of this will be familiar. The difference here is that this doc describes the *productized* version — what the customer interacts with, how the data is stored, how the system uses it on every generation.

---

## What the Context Layer is

For each customer, IrieStack stores a structured document — their **Context Stack** — that captures three things that rarely change:

1. **Identity** — who they are, what they build, what they refuse to do
2. **Voice** — how they sound when the writing is right (samples, banned words, tells)
3. **Audience** — who the work is for and what they actually want

Plus a fourth layer (**Task**) which is filled in dynamically per request.

This stack loads automatically as the system prompt for every content generation. The customer never re-explains who they are. The output compounds in quality session over session because the model isn't starting from zero each time.

---

## Why this matters

Every other AI content tool on the market falls into one of two categories:

**Category A — generic-prompt tools** (Jasper, Copy.ai, the long tail). Customer types a request, gets generic output. Output sounds like AI because there's no persistent context.

**Category B — voice-cloning tools** (Anyword, certain newer entrants). Train on the customer's past content. Better, but the training is opaque — the customer can't see or edit what the model "knows" about them, and the voice often drifts in weird ways.

IrieStack is **Category C — context-system tools**. The customer's Context Stack is a document they can read, edit, and own. It's transparent. It's portable. It's the asset.

This matters for three reasons:

1. **Quality** — explicit context produces better output than implicit training, especially for voice.
2. **Trust** — customers can see exactly what the AI "thinks" about them, edit it, correct it.
3. **Lock-in** — the longer they refine the stack, the more switching costs accumulate. Their stack is theirs, but the value of refining it lives inside IrieStack.

---

## How the customer builds their stack

Two paths, customer's choice during onboarding:

### Path A — The Bootstrap Interview (recommended, default)

The customer goes through a chat-based interview run by the IrieStack onboarding agent. ~15 questions, ~15 minutes, structured in three phases (Identity → Voice → Audience).

The interview is run by Claude with a specialized system prompt (see `prompts/bootstrap-interview.md`). Key behaviors of this prompt:

- Asks ONE question at a time. No question dumps.
- Drills on vague answers. "I want to sound professional" → "What does professional mean to you? Who's a writer in your space who sounds the way you want to sound?"
- Refuses to accept adjective-only voice descriptions. Forces the customer to paste actual writing samples.
- Uses the "and then?" technique on audience desires to drill past surface answers.
- At the end, summarizes what it heard, asks for corrections, then writes the final stack document.

The interview is the most important UX surface in the entire product. If the interview is shallow, the stack is shallow, and the entire product underdelivers. We invest disproportionately in this.

### Path B — Manual Edit (for customers who already know what they want)

The customer is shown a four-section editor (Identity / Voice / Audience, with Task pre-explained). They fill it in directly. Tooltips explain each field with examples.

Every customer can switch between paths at any time — the interview can be re-run later, and the manual editor is always available.

---

## How the stack is stored

The `context_stacks` table holds one active row per user. Schema:

```
context_stacks
  id             uuid PRIMARY KEY
  user_id        uuid REFERENCES users(id)
  identity_md    text     -- markdown content of layer 1
  voice_md       text     -- markdown content of layer 2
  audience_md    text     -- markdown content of layer 3
  voice_samples  jsonb    -- array of structured samples (extracted from voice_md)
  banned_words   jsonb    -- array of banned words/phrases (extracted from voice_md)
  version        integer  -- bumps on every save
  is_active      boolean  -- only one active per user; older versions kept for history
  created_at     timestamp
  updated_at     timestamp
```

The `voice_samples` and `banned_words` columns are denormalized extracts from the voice markdown for performance — we don't want to re-parse the voice section on every generation request. They're regenerated automatically on save.

History is preserved by setting `is_active = false` on the previous row instead of deleting. Customers can browse old versions in the editor and revert.

---

## How the stack is loaded into a generation

The Stack Loader is a pure function (no Claude call). On every content generation request, it:

1. Fetches the customer's active `context_stacks` row
2. Composes the system prompt by concatenating the three layers + the Interrogation Protocol
3. Returns the formatted prompt to the calling agent (Repurposer, Generator, etc.)

The composed system prompt looks roughly like this (with the customer's actual content filled in):

```
You are producing content on behalf of the user described below.
Read this context completely before responding to any task.

# Identity
[identity_md content]

# Voice
[voice_md content, with samples shown verbatim]

# Audience
[audience_md content]

# Interrogation Protocol
Before starting any non-trivial task, identify what you don't know
that would meaningfully change the output. If there are 1–3 important
unknowns, ask them as clarifying questions before producing anything.

---

The user will now give you a task.
```

This system prompt is identical across all engine agents (Repurposer, Generator, Voice Validator) — what changes is the user-message-level task that follows.

---

## The Voice Validator (the quality gate)

After any content generation, before pieces hit the dashboard, the Voice Validator runs.

The Validator is a separate Claude call (using Opus for higher quality reasoning) that takes:

- The customer's voice samples and banned words
- The generated piece

And outputs:

- A score 0–100 for voice match
- Specific lines that drift from the voice (with reasons)
- Suggested edits to bring it back into voice

If a piece scores below the customer's threshold (default 70, customer-configurable in settings), the system auto-revises it once with the Validator's suggested edits. If it still fails, the piece is staged with a "voice warning" badge so the customer knows to review it manually before approving.

This is the difference between content that sounds like you and content that *almost* sounds like you. The Validator is what catches the drift.

---

## How the stack evolves

The stack isn't static. Three feedback mechanisms keep it sharp:

### 1. Manual edits

The customer can edit any part of the stack from the editor at any time. Every save bumps `version` and creates a history row. Encouraged in the UI: "Reviewed your output and noticed something off? Update your stack."

### 2. Drift detection

When the Voice Validator flags pieces below threshold repeatedly across many generations, the system surfaces a notification: *"Your last 10 generations averaged 64/100 on voice match. This usually means your voice samples need updating. Would you like to refresh them?"*

This is a soft prompt, not automatic. The customer decides if the stack needs revision.

### 3. Approval signals (Phase 4)

Every approve/reject/edit action on a generated piece is logged in `approvals_log`. In Phase 4, when there's enough data, the system periodically analyzes patterns:

- "You consistently reject pieces that open with rhetorical questions. Should we add that to your banned patterns?"
- "Your top 20 approved LinkedIn posts all start with a one-line hook followed by a line break. Should we make that an explicit pattern?"

Again — the system surfaces, the customer decides. We never silently mutate the stack.

---

## Multiple stacks per customer (deferred)

For v1, each customer has exactly one Context Stack — their personal one.

In a future version, customers could maintain multiple stacks (one per persona, one per client if they're an agency, one per product line). The schema already supports this (`is_active` boolean lets multiple rows exist), but the UI in v1 only shows the single active stack.

When this becomes a feature: a stack picker at the top of the content trigger UI, plus a stack management screen. Probably Phase 4 or post-Phase-4.

---

## What the customer sees

The Context Stack lives at `/app/stack` in the dashboard. The page has:

- **Top bar:** version number, last edited date, "Regenerate from interview" button
- **Three sections** (Identity / Voice / Audience), each in a card with:
  - Markdown editor (with preview toggle)
  - Inline help text explaining what good answers look like
  - For voice: sample editor with "add sample / remove sample" controls, banned words list
- **Right sidebar:**
  - Health indicator (when did you last edit this? how many drift warnings recently?)
  - Recent revisions with one-click revert
  - "Test your stack" button — opens a quick chat where the customer can paste a fake task and see how the AI responds with the current stack loaded

The editor is the second-most-important UX surface in the product (after the bootstrap interview). Customers who edit their stack regularly are the customers who succeed with IrieStack — making it pleasant to use is non-negotiable.

---

## Privacy & portability

Two non-negotiable customer commitments around the stack:

1. **It's theirs.** Customers can export their full stack as a single markdown file at any time, with one click. The exported file is identical in format to the standalone Context Stack package — meaning a customer who exports could load it into ChatGPT, Claude, Cursor, or anywhere else without us. We don't lock the data.

2. **It's private.** Stack contents are never used for training, never shown to other customers, never used to improve the engine for anyone but that user. This is documented in the privacy policy and reinforced in the UI.

The combination of "your data is yours, exportable, portable" and "the value of refining it accumulates inside our product" is the defensible position. We don't compete on lock-in. We compete on being the place where the work actually compounds.
