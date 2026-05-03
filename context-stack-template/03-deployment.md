# Deployment

**Once you have a filled-in Context Stack, here's how to load it into the tools you actually use.** The stack is plain text — anywhere that accepts text instructions, it works.

---

## ChatGPT (Custom Instructions)

1. Click your name (bottom-left) → **Customize ChatGPT**.
2. In the second box ("How would you like ChatGPT to respond?"), paste your filled-in Context Stack.
3. Save.

ChatGPT loads this on every new chat. You don't have to do anything else.

**Limitation:** Custom instructions have a character cap (~1500 chars per box). If your stack is longer, trim it down or use Projects (next).

## ChatGPT (Projects)

For longer stacks or work-specific contexts:

1. Create a new Project.
2. Open Project settings → **Instructions**.
3. Paste your stack there.
4. Use that Project for all sessions where you want this context.

Projects let you run multiple stacks (one per project/persona/client) without overwriting each other.

---

## Claude (Projects)

1. In Claude.ai, create a new Project.
2. In the Project's **Custom instructions** field, paste your Context Stack.
3. Optionally, drop supporting documents into the Project's knowledge area (brand assets, past work samples, reference docs).
4. Start chats inside that Project. They all inherit the stack.

For one-off use without a Project: just paste the stack as the first message of any new chat. It's not as clean, but it works.

---

## Claude Code / Claude Cowork

Both support persistent context files loaded at session start.

1. Save your stack as a markdown file in your project directory (e.g. `CONTEXT.md` or `CLAUDE.md`).
2. The agent will read it on each session.
3. For Cowork specifically: drop the file into the "Claude Context" folder Cowork watches, and it loads automatically.

This is the closest analog to Hormozi's actual setup.

---

## Cursor (Rules)

1. In Cursor, open **Settings → Rules for AI**.
2. Paste the stack.

Or, project-specific:

1. Create a `.cursorrules` file in the project root.
2. Paste the stack there.

Cursor loads it on every completion.

---

## Cline / Continue / Aider / other code agents

Same pattern: each has a "rules" or "system prompt" or "instructions" config file. Look for it in the tool's settings or repo root. Paste the stack. Done.

---

## n8n / Make / Zapier (workflows that call LLMs)

If you're calling OpenAI/Anthropic from a workflow node:

1. In the node config, find the **System message** or **System prompt** field.
2. Paste your stack.
3. Save it as a reusable variable or template if the platform supports it, so you can pull it into multiple workflow nodes without copy-pasting.

If you're running this across many workflows, consider storing the stack in a single source of truth (a Notion page, a Google Doc, an environment variable) and referencing it from there. That way an update to the stack propagates everywhere automatically.

---

## Notion AI / other doc-embedded AI

Most of these don't have a system prompt slot. Workaround: keep a "context" page in your workspace with the stack on it, and start every important AI session by referencing that page first. Not ideal, but functional.

---

## A fresh chat in any LLM (no setup)

If you're somewhere that doesn't have persistent instructions:

1. Paste the stack as your first message.
2. Add: "Acknowledge you've loaded this context, then wait for my task."
3. Then send your actual task as the second message.

This works in literally anything that takes text input. It's the universal fallback.

---

## A note on the "ask clarifying questions" instruction

The Interrogation Protocol at the bottom of your stack tells the model to ask before guessing. Some tools and some models honor this better than others.

**Models that handle it well:** Claude (any recent version), GPT-4 class and above, Gemini 1.5+.

**Models that ignore it:** Smaller open-source models, older GPT-3.5 variants, anything heavily fine-tuned for "just answer the question."

If the protocol isn't being honored, two fixes:

1. Move it to the top of the stack instead of the bottom (some models weight earlier instructions more heavily).
2. Strengthen the language: "You MUST ask clarifying questions before any non-trivial task. Do not produce output until you have asked at least one clarifying question or determined no clarification is needed."

---

## Multi-stack setups

Once you've used a single stack for a few weeks, you'll probably want more than one — a stack for personal writing, a stack for a specific client, a stack for a specific product. Each needs its own Identity/Voice/Audience.

Two ways to organize:

**Folder approach:**
```
context-stacks/
  personal.md
  client-acme.md
  product-x.md
```
Pick the right one, paste it where needed.

**Layered approach:**
Keep one base stack with your Identity layer (you don't change). Then maintain separate Voice + Audience overlays per project. Stitch the base + the overlay together when deploying.

The folder approach is simpler. The layered approach scales better once you have 5+ contexts.

---

## How to tell it's working

After deploying, run this test:

1. Start a fresh session.
2. Type a one-sentence task: "Write a short post about [some topic relevant to your work]."
3. Read the output.

**Working:** It sounds like you. It uses your specific vocabulary, dodges your banned words, frames things for your audience without being told to.

**Not working:** It sounds like generic AI. It uses banned words. It addresses a generic audience. It explains things you would never explain because your audience already knows them.

If it's not working, the failure is almost always in **Layer 2 (Voice)** — usually because the samples are too short, too similar, or not actually representative. Replace the samples with longer, more varied ones and re-test.

If voice is right but the framing is off, **Layer 3 (Audience)** is thin — usually the "what they actually want" line is still surface-level. Run that section through the "and then?" drill again.

If voice and audience are right but the AI is still doing things you don't want, **Layer 1 (Identity)** is missing rules. Add to the "What I refuse to do" list.
