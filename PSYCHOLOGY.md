# PSYCHOLOGY.md — IrieStack

```
Doctrine:          Irie Behavioral Design Layer (per-product application)
Version:           2026-05
Canonical source:  paperclip-irie-config/PSYCHOLOGY.md (external; replicated here for repo self-containment)
Companion to:      DESIGN.md (read both before building any UI)
Scope:             IrieStack — content automation SaaS. Audience:
                   solo creators, brand operators, coaches, founders
                   who want consistent multi-platform output without
                   sounding like an LLM. The Irie Test below applies
                   to every screen, every state, every email.
```

> Read alongside DESIGN.md before building any UI. Design tokens tell you what it looks like. This file tells you how it makes people feel.

---

## The North Star

Every screen, section, and interaction should answer one question:
**Does this feel like the user's voice — handled, on schedule, never AI-flavored?**

That is Irie. For IrieStack specifically: total peace about content. Nothing falling through the cracks. Nothing that sounds machine-written. The system disappears; the voice remains.

---

## Core Psychological Principles

### 1. Trust Before Ask
Never ask for something before you've given something first.
- Show what the system understood about the user's voice before asking for the next answer
- Show a generated post sample before showing the upgrade prompt
- Show the brand before showing the CTA
- **Rule:** Every page earns the right to ask for action.

### 2. Momentum Over Friction
Every scroll, click, and interaction should feel like it's carrying the user forward — not stopping them.
- No dead ends. Every empty state has a next step.
- No walls. Every gate (login, payment) is preceded by desire.
- No confusion. One primary action per screen.
- **Rule:** If someone has to think about what to do next, we failed.

### 3. Specificity Builds Trust
Generic copy feels like a lie. Specific copy feels like truth.
- Bad: "Generate high-quality social media content"
- Good: "20 posts a week, in your voice, ready to ship"
- Bad: "Smart AI understands your brand"
- Good: "Train it once. It writes the way you talk."
- Bad: "Multi-platform support"
- Good: "Posts shaped for LinkedIn, X, Threads, Instagram, and your newsletter — each one platform-native"
- **Rule:** Replace every adjective with a fact or a scene.

### 4. Honesty Over Hype
The product is automation, not magic. Treat the user like an adult.
- Show real progress states ("Generating 4 of 20 posts...") never anthropomorphized ones ("AI is thinking...")
- Show the actual generation cost in tokens or remaining quota — don't hide it
- Show what didn't fit (e.g., "X has a 280-char limit; we trimmed two phrases") — don't pretend the trim was effortless
- **Rule:** Never simulate intelligence the system doesn't have. Never hide a tradeoff the user should know.

### 5. Voice Over Polish
The whole product exists because LLM output sounds generic. The UI must never make the user *feel* generic.
- Onboarding chat reads like a human asking thoughtful questions, not a form survey
- Generated posts include the user's actual phrasings, mannerisms, and references
- The dashboard speaks back to the user using their own words from the Context Stack ("Your Wednesday-morning energy is showing in this batch")
- **Rule:** If the UI ever sounds like an AI assistant talking to a user, rewrite. The system is a quiet editor, not a chatty co-pilot.

### 6. Social Proof Placement
Put proof at the moment of doubt, not at the top of the page.
- Doubt happens at signup — show a generated-post sample (real, anonymized) right above the signup CTA
- Doubt happens at first-generation — show "Most users approve 17 of 20 first-batch posts" near the review queue empty state
- Doubt happens at upgrade — show real outcome quotes from creators near the pricing CTA
- **Rule:** Proof goes where fear lives.

### 7. The Emotion Sequence
Every page follows this emotional arc:
1. **Recognition** — "This is for me" (hero, first 3 seconds)
2. **Curiosity** — "Show me how" (sample output, mechanism explainer)
3. **Desire** — "I want my voice on autopilot" (specific outcomes, real example)
4. **Trust** — "I believe this won't sound like AI" (specificity, sample fidelity, brand story)
5. **Action** — "I'm doing this" (CTA, frictionless onboarding)

Never skip steps. Never reorder them.

### 8. Voice = Personality = Trust
Copy written in Corey's actual voice builds more trust than polished marketing copy.
- Write like you're talking to a creator at a coffee shop
- Short sentences. Real words. No buzzwords.
- If it sounds like an ad, rewrite it.
- **Rule:** Would Corey actually say this? If no, cut it.

---

## Page-Level Psychology

### Marketing / Landing
- **Hero**: Make them feel something in 3 seconds. The promise: their voice, scaled, never sounds like AI. No explaining, just feeling.
- **Scroll 1**: Show a real generated-post sample — actual words, actual platform chip, actual length. Specificity builds trust.
- **Scroll 2**: Make them believe it (the Context Stack mechanism, why it works, what the user owns)
- **Scroll 3**: Make it easy to act (clear CTA, no friction, "Start with a 14-day stack")

### Bootstrap Chat (First-Time Onboarding)
- **Feels like**: a smart human asking thoughtful questions — not a form, not a survey, not a quiz
- **Never feels like**: "Step 3 of 12" progress bars, multiple-choice buttons in a chat bubble, "Tell me about yourself ✨"
- **First message** orients without overwhelming: "I'm going to ask you about how you talk so we can write the way you do. About 10 minutes. We can stop and resume anytime."
- **Each turn** acknowledges the user's previous answer specifically before the next question — proves the system is listening
- **At the end**: a real generated post in the user's voice as the reward for completing the interview. Not a "you did it!" celebration screen — the artifact IS the celebration.

### Generation Review Queue (Daily Use)
- **Feels like**: an editor handed you a stack of drafts to greenlight
- **Never feels like**: a content moderation panel, a notification feed, a TikTok-style swipe stack
- **The post itself dominates**. Approve / Reject / Edit are the chrome around it.
- **Approve is the path.** It's the gold CTA. Reject and Edit are quieter. The visual hierarchy expresses the assumption that the user trusts the system enough to ship most of what comes through.
- **Empty state** ("All caught up") is a calm reward — not "no posts to review" but "you're up to date — your next batch generates Tuesday morning"

### Context Stack Viewer / Editor
- **Feels like**: reviewing your own notes in a personal notebook
- **Never feels like**: a configuration panel, a settings dump, a database admin view
- **Each section** displays the user's own captured words editorially — not as form data with input borders. They are reading their voice back.
- **Edit** is one tap; the edit experience is inline editorial, not "click to enable input"
- **Re-onboarding** is supported — "I want to update how I talk" should never feel like wiping data; it feels like having coffee with the system again

### Approval / Autopilot Mode Switch
- **Feels like**: deciding how much you trust this channel today
- **Never feels like**: a permission setting buried in account preferences
- **The toggle is per-channel** so the user can autopilot LinkedIn but keep approving Twitter — granular trust
- **Switching to autopilot** shows a confirmation that explains the consequence in plain English: "From now on, LinkedIn posts publish automatically. You can switch back any time."
- **Never** uses scary "Are you sure?" framing — autopilot is a feature, not a danger

### Empty States
- Every empty state is an opportunity, not a failure.
- Never show a blank screen — always show a path forward.
- Copy: "Nothing here yet" + specific next action.
- Never: just "No results."

### Error States
- Own the error — don't blame the user.
- Tell them exactly what happened.
- Tell them exactly what to do next.
- Never: "Something went wrong."
- Generation failure example — bad: "AI service unavailable." good: "Generation paused — Anthropic's API timed out. We'll retry in 30 seconds, no quota lost."

### Generation In-Progress
- Show real progress: "Generating post 4 of 20…" with a determinate or indeterminate progress bar
- Show the platform being generated for, if relevant
- **Never** anthropomorphize the system: NO "AI is thinking…" / "Crafting your masterpiece…" / "Working on something special…"
- The system is an editor, not a personality

---

## Motion & Scroll Psychology

### Scroll reveals = dopamine hits
- Reveal content progressively — don't show everything at once
- Each scroll on the marketing page should feel like unwrapping something
- Use scroll-triggered animations to reward attention

### Approval Feedback
- Approve a post: 200ms fade + checkmark on the post; the next post slides in
- **Never** confetti, balloons, fireworks, or "🎉" emojis. The reward is *completion*, not celebration. Approving 20 posts in a row should feel like a calm flow state, not a slot machine.

### Timing
- Entrance animations: 300–500ms
- Content reveals: 400–600ms with slight delay stagger between elements
- Hover states: 150–200ms (instant-feeling)
- Page transitions: 200–300ms

### What motion should say
- "This is alive" — not "look how animated this is"
- Motion reinforces meaning, not decorates
- **Rule:** If removing the animation changes nothing about the message, remove the animation.

---

## Copywriting Rules

### Headlines
- Lead with the feeling, not the feature
- Max 8 words for hero headlines
- Use present tense ("Your voice, on autopilot") not future ("You will save time")

### CTAs
- Say what happens next, not what the button does
- Bad: "Submit" / "Click Here" / "Learn More" / "Get Started"
- Good: "Start My Stack" / "Generate This Week's Posts" / "Approve & Schedule" / "See a Sample"
- One CTA per screen. Two CTAs = no CTA.

### Body Copy
- Front-load the most important word in every sentence
- Cut every sentence by 30% after you write it
- Read it out loud. If you stumble, rewrite it.

### Generated-Content UI Copy
- The chrome around generated posts uses neutral, editorial language
- Bad: "✨ Your AI-generated content"
- Good: "Ready for review (20)"
- Bad: "Magic words from your AI assistant"
- Good: "From your stack"

---

## The Irie Test

Before shipping any screen, ask:
1. Does this feel like the user's voice handled — calm, on schedule, never AI-flavored?
2. Does this feel warm, confident, and real — not corporate, not "AI-app generic"?
3. Would Corey say this to a creator face to face?
4. Is there any friction we haven't eliminated?
5. Does every empty state have a next step?
6. Does any chrome anthropomorphize the system or simulate intelligence it doesn't have?

If any answer is no — rework it before shipping.
