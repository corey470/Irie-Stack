# The Context Stack

**A universal system for getting compounding output from any AI tool.**

---

## The problem this solves

Most people use AI like a vending machine. Walk up, type a long prompt explaining who they are, what they're working on, who their audience is, what voice they want, and what they actually need — every single session. The AI delivers something generic. They tweak the prompt. They get something slightly less generic. They start over tomorrow.

The output never compounds. The work never gets faster. The model never sounds like *them*.

The fix is not better prompts. The fix is to stop putting the durable stuff in prompts at all.

---

## The core idea

Separate the **who, how, and for-whom** from the **task**.

The first three are stable. They change rarely. They belong in a layer the AI loads automatically before it ever sees a request.

The task is the only thing that should change session to session — and once the first three layers are doing their job, the task can be stupidly short.

That's it. That's the whole system. Everything else is implementation.

---

## The four layers

| Layer | What it answers | How often it changes |
|-------|-----------------|----------------------|
| **1. Identity** | Who is doing the work? | Rarely (quarterly) |
| **2. Voice** | How does it sound when it's right? | Rarely (quarterly) |
| **3. Audience** | Who is it for, and what do they actually want? | Per project / product |
| **4. Task** | What specifically needs to happen right now? | Every session |

Layers 1–3 live in a document. Layer 4 is what you type into the chat box.

When layers 1–3 are dialed in, layer 4 collapses from a 500-word prompt to a sentence.

---

## Why this works

**It compounds.** Every refinement to the document improves every future session. You're not re-teaching — you're upgrading.

**It's portable.** Plain text. Works in ChatGPT custom instructions, Claude Projects, Cursor rules, Cowork, n8n, Cline, Notion AI, or pasted into a fresh chat. Move it in ten seconds.

**It's interview-able.** You don't fill in a blank template. You get interviewed into existence by an LLM that asks the right questions, and your stack writes itself in 15 minutes.

**It hands the model an off-ramp.** Built into the system is an instruction telling the model to *ask clarifying questions before guessing*. This single rule eliminates more bad output than any prompt-engineering trick.

---

## What's in this package

| File | What it is |
|------|------------|
| `README.md` | This file. The why. |
| `01-the-stack.md` | The four-layer template. Fill this in (or have it filled in for you via the bootstrap). This is the document you'll deploy. |
| `02-bootstrap-interview.md` | A single prompt you paste into any LLM. It interviews you for ~15 minutes and outputs your filled-in stack. |
| `03-deployment.md` | How to load your stack into ChatGPT, Claude, Cursor, Cowork, n8n, or anywhere else. |
| `04-maintenance.md` | How to keep the stack alive — when to update, what to watch for, how to know it's working. |

---

## How to use this (15-minute version)

1. Open `02-bootstrap-interview.md`. Copy the entire prompt.
2. Paste it into ChatGPT, Claude, or whatever LLM you prefer.
3. Answer the questions it asks you. Be honest, not polished.
4. It will hand you back a completed Context Stack document.
5. Save that document. Open `03-deployment.md`. Pick the tool you actually use. Follow the steps.
6. Stop writing long prompts. Start writing short tasks.

---

## How to use this (the slower, deeper version)

1. Read `01-the-stack.md` end to end. Understand what each layer is asking for and why.
2. Fill it in by hand. Treat it like writing your own brand brief — because it is.
3. Test it: paste the filled-in stack as a system prompt, then give it three different short tasks. If the output sounds like you on all three, the stack is working. If it sounds generic on any of them, the corresponding layer needs sharpening.
4. Refine. Deploy.

---

## What this is *not*

- Not a tool. There's nothing to install.
- Not a prompt library. Prompts are layer 4 — the disposable layer.
- Not specific to any platform. If a future AI tool accepts text instructions, this works in it.
- Not a replacement for thinking. The interview surfaces decisions you've been avoiding making about your voice, your audience, and what you actually do. The system is only as good as the answers you give it.

---

**Start with `02-bootstrap-interview.md` if you want speed.**
**Start with `01-the-stack.md` if you want to understand what you're building.**
